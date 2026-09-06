using GamersCommunity.Core.Enums;
using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Consumer.Serialization;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;
using ILogger = Serilog.ILogger;

namespace Platform.Consumer.Services.Data;

public class MessagesService(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher,
    IMessageContentCipher cipher,
    ILogger logger) : IBusService
{
    private const int ThreadPageSize = 20;
    private const int StatusBlocked = 4;

    BusServiceTypeEnum IBusService.Type => BusServiceTypeEnum.DATA;

    public string Resource => "Messages";

    public async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        switch (message.Action.ToUpperInvariant())
        {
            case "LISTTHREAD":
                return JsonSafe.Serialize(await ListThreadAsync(message, ct));
            case "CREATE":
                return JsonSafe.Serialize(await CreateMineAsync(message, ct));
            case "GET":
                return JsonSafe.Serialize(await GetMineAsync(message, ct));
            case "MARKREAD":
                return JsonSafe.Serialize(await MarkThreadReadAsync(message, ct));
            default:
                throw new InternalServerErrorException("ACTION_NOT_IMPLEMENTED", $"Action {message.Action} not implemented");
        }
    }

    private async Task<List<MessageThreadDto>> ListThreadAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<ListThreadRequest>(message.Data);
        var conversation = await RequireConversationByPublicIdAsync(request.ConversationPublicId, ct);
        var membership = await RequireMemberAsync(conversation.Id, me, ct);

        var take = request.Take is > 0 and <= 50 ? request.Take.Value : ThreadPageSize;
        var query = context.Messages.AsNoTracking()
            .Where(m => m.IdConversation == conversation.Id && m.CreationDate >= membership.JoinedAt);

        if (request.BeforePublicId is { } beforePublicId && beforePublicId != Guid.Empty)
        {
            var cursor = await context.Messages.AsNoTracking()
                .Where(m => m.PublicId == beforePublicId)
                .Select(m => new { m.PublicId, m.CreationDate })
                .FirstOrDefaultAsync(ct);

            if (cursor is null)
                throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

            query = query.Where(m =>
                m.CreationDate < cursor.CreationDate
                || (m.CreationDate == cursor.CreationDate && m.PublicId.CompareTo(cursor.PublicId) < 0));
        }

        var rows = await query
            .OrderByDescending(m => m.CreationDate)
            .ThenByDescending(m => m.PublicId)
            .Take(take)
            .Select(m => new MessageThreadDto
            {
                PublicId = m.PublicId,
                ConversationPublicId = conversation.PublicId,
                Content = m.Content,
                IdSender = m.IdSender,
                SenderPublicId = m.IdSenderNavigation.PublicId,
                SenderNickname = m.IdSenderNavigation.Nickname,
                SenderDiscriminator = m.IdSenderNavigation.Discriminator,
                SenderAvatarUrl = m.IdSenderNavigation.AvatarUrl,
                CreationDate = m.CreationDate,
                ParentPublicId = m.ParentPublicId,
                ParentContent = m.ParentMessage != null ? m.ParentMessage.Content : null,
            })
            .ToListAsync(ct);

        foreach (var row in rows)
        {
            row.Content = cipher.Decrypt(row.Content);
            if (row.ParentContent is not null)
                row.ParentContent = cipher.Decrypt(row.ParentContent);
        }

        return rows;
    }

    private async Task<Guid> CreateMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<CreateMessageRequest>(message.Data);
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new BadRequestException("CONTENT_MANDATORY", "Content mandatory");

        var conversation = await RequireConversationByPublicIdAsync(request.ConversationPublicId, ct);
        await RequireMemberAsync(conversation.Id, me, ct);

        if (conversation.Kind == ConversationKind.Dm)
        {
            var peerId = await context.ConversationMembers.AsNoTracking()
                .Where(m => m.IdConversation == conversation.Id && m.IdUser != me)
                .Select(m => m.IdUser)
                .FirstOrDefaultAsync(ct);
            if (peerId != 0 && await IsBlockedAsync(me, peerId, ct))
                throw new ForbiddenException("BLOCKED", "Cannot message a blocked player");
        }

        var parent = await ResolveParentAsync(conversation.Id, request.ParentPublicId, ct);
        var sender = await context.Users.AsNoTracking()
            .Where(u => u.Id == me)
            .Select(u => new { u.Id, u.PublicId, u.Nickname, u.Discriminator, u.AvatarUrl, u.IdKeycloak })
            .FirstAsync(ct);

        var plaintext = request.Content.Trim();
        var now = DateTime.UtcNow;
        var entity = new Message
        {
            PublicId = Guid.NewGuid(),
            Content = cipher.Encrypt(plaintext),
            IdConversation = conversation.Id,
            IdSender = me,
            ParentPublicId = parent?.PublicId,
            CreationDate = now,
            ModificationDate = now,
        };

        await context.Messages.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);

        var recipientIds = await (
            from m in context.ConversationMembers.AsNoTracking()
            join u in context.Users.AsNoTracking() on m.IdUser equals u.Id
            where m.IdConversation == conversation.Id
            select u.IdKeycloak).ToListAsync(ct);
        var recipients = recipientIds.Select(id => id.ToString("D")).ToArray();

        try
        {
            await realtimePublisher.PublishAsync(
                new MessageCreatedRealtimeEvent
                {
                    RecipientKeycloaks = recipients,
                    Message = new MessageRealtimePayload
                    {
                        PublicId = entity.PublicId,
                        ConversationPublicId = conversation.PublicId,
                        Content = plaintext,
                        IdSender = entity.IdSender,
                        SenderPublicId = sender.PublicId,
                        SenderNickname = sender.Nickname,
                        SenderDiscriminator = sender.Discriminator,
                        SenderAvatarUrl = sender.AvatarUrl,
                        CreationDate = UtcDateTimeJsonConverter.AsUtc(entity.CreationDate),
                        ParentPublicId = entity.ParentPublicId,
                        ParentContent = parent?.Content,
                    },
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish message.created realtime event for message {MessageId}.", entity.PublicId);
        }

        return entity.PublicId;
    }

    private async Task<int> MarkThreadReadAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<MarkThreadReadRequest>(message.Data);
        var conversation = await RequireConversationByPublicIdAsync(request.ConversationPublicId, ct);
        var membership = await context.ConversationMembers
            .FirstOrDefaultAsync(m => m.IdConversation == conversation.Id && m.IdUser == me, ct)
            ?? throw new ForbiddenException("FORBIDDEN", "Not a participant of this conversation");

        membership.LastReadAt = DateTime.UtcNow;
        membership.ModificationDate = membership.LastReadAt.Value;
        await context.SaveChangesAsync(ct);
        return 1;
    }

    private async Task<MessageThreadDto> GetMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (message.PublicId is not Guid publicId || publicId == Guid.Empty)
            throw new BadRequestException("ID_MANDATORY", "Id mandatory");

        var entity = await context.Messages.AsNoTracking()
            .Where(m => m.PublicId == publicId)
            .Select(m => new MessageThreadDto
            {
                PublicId = m.PublicId,
                ConversationPublicId = m.IdConversationNavigation.PublicId,
                Content = m.Content,
                IdSender = m.IdSender,
                SenderPublicId = m.IdSenderNavigation.PublicId,
                SenderNickname = m.IdSenderNavigation.Nickname,
                SenderDiscriminator = m.IdSenderNavigation.Discriminator,
                SenderAvatarUrl = m.IdSenderNavigation.AvatarUrl,
                CreationDate = m.CreationDate,
                ParentPublicId = m.ParentPublicId,
                ParentContent = m.ParentMessage != null ? m.ParentMessage.Content : null,
            })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        var conversationId = await context.Messages.AsNoTracking()
            .Where(m => m.PublicId == publicId)
            .Select(m => m.IdConversation)
            .FirstAsync(ct);
        await RequireMemberAsync(conversationId, me, ct);
        entity.Content = cipher.Decrypt(entity.Content);
        if (entity.ParentContent is not null)
            entity.ParentContent = cipher.Decrypt(entity.ParentContent);
        return entity;
    }

    private async Task<ParentQuote?> ResolveParentAsync(int conversationId, Guid? parentPublicId, CancellationToken ct)
    {
        if (parentPublicId is not Guid id || id == Guid.Empty)
            return null;

        var row = await context.Messages.AsNoTracking()
            .Where(m => m.PublicId == id)
            .Select(m => new { m.PublicId, m.IdConversation, m.Content })
            .FirstOrDefaultAsync(ct);

        if (row is null)
            throw new NotFoundException("PARENT_NOT_FOUND", "Parent message not found");
        if (row.IdConversation != conversationId)
            throw new BadRequestException("INVALID_PARENT", "Parent message is not in this conversation");

        return new ParentQuote(row.PublicId, cipher.Decrypt(row.Content));
    }

    private async Task<Conversation> RequireConversationByPublicIdAsync(Guid conversationPublicId, CancellationToken ct)
    {
        if (conversationPublicId == Guid.Empty)
            throw new BadRequestException("CONVERSATION_MANDATORY", "Conversation id mandatory");

        return await context.Conversations.AsNoTracking()
            .FirstOrDefaultAsync(c => c.PublicId == conversationPublicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
    }

    private async Task<ConversationMember> RequireMemberAsync(int conversationId, int userId, CancellationToken ct)
    {
        return await context.ConversationMembers.AsNoTracking()
            .FirstOrDefaultAsync(m => m.IdConversation == conversationId && m.IdUser == userId, ct)
            ?? throw new ForbiddenException("FORBIDDEN", "Not a participant of this conversation");
    }

    private Task<bool> IsBlockedAsync(int a, int b, CancellationToken ct) =>
        context.Friends.AsNoTracking().AnyAsync(
            f => f.IdFriendStatus == StatusBlocked
                && ((f.IdFriendAsking == a && f.IdFriendReceive == b)
                    || (f.IdFriendAsking == b && f.IdFriendReceive == a)),
            ct);

    private async Task<int> RequireCallerUserIdAsync(BusMessage message, CancellationToken ct)
    {
        if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");

        var user = await context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdKeycloak == idKeycloak, ct);

        return user?.Id ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
    }

    private sealed class MarkThreadReadRequest
    {
        public Guid ConversationPublicId { get; set; }
    }

    private sealed class ListThreadRequest
    {
        public Guid ConversationPublicId { get; set; }
        public Guid? BeforePublicId { get; set; }
        public int? Take { get; set; }
    }

    private sealed class CreateMessageRequest
    {
        public Guid ConversationPublicId { get; set; }
        public string Content { get; set; } = "";
        public Guid? ParentPublicId { get; set; }
    }

    private sealed record ParentQuote(Guid PublicId, string Content);

    private sealed class MessageThreadDto
    {
        public Guid PublicId { get; set; }
        public Guid ConversationPublicId { get; set; }
        public string Content { get; set; } = "";
        public int IdSender { get; set; }
        public Guid SenderPublicId { get; set; }
        public string SenderNickname { get; set; } = "";
        public string SenderDiscriminator { get; set; } = "";
        public string SenderAvatarUrl { get; set; } = "";
        public DateTime CreationDate { get; set; }
        public Guid? ParentPublicId { get; set; }
        public string? ParentContent { get; set; }
    }
}
