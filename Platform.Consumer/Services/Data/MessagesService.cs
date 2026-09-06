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
            case "LIST":
                return JsonSafe.Serialize(await ListConversationsAsync(message, ct));
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

    private async Task<List<MessageConversationDto>> ListConversationsAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var mine = await context.Messages.AsNoTracking()
            .Where(m => m.IdSender == me || m.IdReceiver == me)
            .Select(m => new
            {
                m.PublicId,
                m.Content,
                m.IdSender,
                m.IdReceiver,
                m.IsRead,
                m.CreationDate,
                PeerId = m.IdSender == me ? m.IdReceiver : m.IdSender,
            })
            .ToListAsync(ct);

        return mine
            .GroupBy(m => m.PeerId)
            .Select(g =>
            {
                var last = g.OrderByDescending(x => x.CreationDate).ThenByDescending(x => x.PublicId).First();
                var unread = g.Count(x => x.IdReceiver == me && !x.IsRead);
                return new MessageConversationDto
                {
                    PublicId = last.PublicId,
                    Content = cipher.Decrypt(last.Content),
                    IdSender = last.IdSender,
                    IdReceiver = last.IdReceiver,
                    IsRead = last.IsRead,
                    CreationDate = last.CreationDate,
                    UnreadCount = unread,
                };
            })
            .OrderByDescending(x => x.CreationDate)
            .ToList();
    }

    private async Task<List<MessageThreadDto>> ListThreadAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<ListThreadRequest>(message.Data);
        if (request.PeerId <= 0)
            throw new BadRequestException("PEER_MANDATORY", "Peer id mandatory");

        var take = request.Take is > 0 and <= 50 ? request.Take.Value : ThreadPageSize;
        var query = context.Messages.AsNoTracking()
            .Where(m =>
                (m.IdSender == me && m.IdReceiver == request.PeerId)
                || (m.IdSender == request.PeerId && m.IdReceiver == me));

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
                Content = m.Content,
                IdSender = m.IdSender,
                IdReceiver = m.IdReceiver,
                IsRead = m.IsRead,
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
        if (request.IdReceiver <= 0)
            throw new BadRequestException("RECEIVER_MANDATORY", "Receiver mandatory");
        if (request.IdReceiver == me)
            throw new BadRequestException("INVALID_RECEIVER", "Cannot message yourself");

        var peers = await context.Users.AsNoTracking()
            .Where(u => u.Id == me || u.Id == request.IdReceiver)
            .Select(u => new { u.Id, u.IdKeycloak, u.Nickname, u.Discriminator })
            .ToListAsync(ct);

        var sender = peers.FirstOrDefault(u => u.Id == me)
            ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
        var receiver = peers.FirstOrDefault(u => u.Id == request.IdReceiver)
            ?? throw new NotFoundException("RECEIVER_NOT_FOUND", "Receiver not found");

        var blocked = await context.Friends.AsNoTracking().AnyAsync(
            f =>
                f.IdFriendStatus == StatusBlocked
                && ((f.IdFriendAsking == me && f.IdFriendReceive == request.IdReceiver)
                    || (f.IdFriendAsking == request.IdReceiver && f.IdFriendReceive == me)),
            ct);
        if (blocked)
            throw new ForbiddenException("BLOCKED", "Cannot message a blocked player");

        var parent = await ResolveParentAsync(me, request.IdReceiver, request.ParentPublicId, ct);

        var plaintext = request.Content.Trim();
        var now = DateTime.UtcNow;
        var entity = new Message
        {
            PublicId = Guid.NewGuid(),
            Content = cipher.Encrypt(plaintext),
            IdSender = me,
            IdReceiver = request.IdReceiver,
            IsRead = false,
            ParentPublicId = parent?.PublicId,
            CreationDate = now,
            ModificationDate = now,
        };

        await context.Messages.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);

        try
        {
            await realtimePublisher.PublishAsync(
                new MessageCreatedRealtimeEvent
                {
                    SenderKeycloak = sender.IdKeycloak.ToString(),
                    ReceiverKeycloak = receiver.IdKeycloak.ToString(),
                    Message = new MessageRealtimePayload
                    {
                        PublicId = entity.PublicId,
                        Content = plaintext,
                        IdSender = entity.IdSender,
                        IdReceiver = entity.IdReceiver,
                        IsRead = entity.IsRead,
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
        if (request.PeerId <= 0)
            throw new BadRequestException("PEER_MANDATORY", "Peer id mandatory");

        var now = DateTime.UtcNow;
        var unread = await context.Messages
            .Where(m => m.IdReceiver == me && m.IdSender == request.PeerId && !m.IsRead)
            .ToListAsync(ct);

        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ModificationDate = now;
        }

        await context.SaveChangesAsync(ct);
        return unread.Count;
    }

    private async Task<Message> GetMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (message.PublicId is not Guid publicId || publicId == Guid.Empty)
            throw new BadRequestException("ID_MANDATORY", "Id mandatory");

        var entity = await context.Messages.AsNoTracking()
            .FirstOrDefaultAsync(m => m.PublicId == publicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        if (entity.IdSender != me && entity.IdReceiver != me)
            throw new ForbiddenException("FORBIDDEN", "Not a participant of this conversation");
        entity.Content = cipher.Decrypt(entity.Content);
        return entity;
    }

    private async Task<ParentQuote?> ResolveParentAsync(int me, int peerId, Guid? parentPublicId, CancellationToken ct)
    {
        if (parentPublicId is not Guid id || id == Guid.Empty)
            return null;

        var row = await context.Messages.AsNoTracking()
            .Where(m => m.PublicId == id)
            .Select(m => new { m.PublicId, m.IdSender, m.IdReceiver, m.Content })
            .FirstOrDefaultAsync(ct);

        if (row is null)
            throw new NotFoundException("PARENT_NOT_FOUND", "Parent message not found");

        var sameThread =
            (row.IdSender == me && row.IdReceiver == peerId)
            || (row.IdSender == peerId && row.IdReceiver == me);
        if (!sameThread)
            throw new BadRequestException("INVALID_PARENT", "Parent message is not in this conversation");

        return new ParentQuote(row.PublicId, row.IdSender, row.IdReceiver, cipher.Decrypt(row.Content));
    }

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
        public int PeerId { get; set; }
    }

    private sealed class ListThreadRequest
    {
        public int PeerId { get; set; }
        public Guid? BeforePublicId { get; set; }
        public int? Take { get; set; }
    }

    private sealed class CreateMessageRequest
    {
        public int IdReceiver { get; set; }
        public string Content { get; set; } = "";
        public Guid? ParentPublicId { get; set; }
    }

    private sealed record ParentQuote(Guid PublicId, int IdSender, int IdReceiver, string Content);

    private sealed class MessageThreadDto
    {
        public Guid PublicId { get; set; }
        public string Content { get; set; } = "";
        public int IdSender { get; set; }
        public int IdReceiver { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreationDate { get; set; }
        public Guid? ParentPublicId { get; set; }
        public string? ParentContent { get; set; }
    }

    private sealed class MessageConversationDto
    {
        public Guid PublicId { get; set; }
        public string Content { get; set; } = "";
        public int IdSender { get; set; }
        public int IdReceiver { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreationDate { get; set; }
        public int UnreadCount { get; set; }
    }
}
