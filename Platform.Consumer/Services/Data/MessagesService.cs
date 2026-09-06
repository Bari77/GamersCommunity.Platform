using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Realtime;
using Platform.Consumer.Serialization;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;
using ILogger = Serilog.ILogger;

namespace Platform.Consumer.Services.Data;

public class MessagesService(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher,
    ILogger logger)
    : GenericDataService<GamersCommunityDbContext, Message>(context, "Messages")
{
    private const int ThreadPageSize = 20;
    private const int StatusBlocked = 4;

    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
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
                return await base.HandleAsync(message, ct);
        }
    }

    private async Task<List<MessageConversationDto>> ListConversationsAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var mine = await Context.Messages.AsNoTracking()
            .Where(m => m.IdSender == me || m.IdReceiver == me)
            .Select(m => new
            {
                m.Id,
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
                var last = g.OrderByDescending(x => x.CreationDate).ThenByDescending(x => x.Id).First();
                var unread = g.Count(x => x.IdReceiver == me && !x.IsRead);
                return new MessageConversationDto
                {
                    Id = last.Id,
                    PublicId = last.PublicId,
                    Content = last.Content,
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
        var query = Context.Messages.AsNoTracking()
            .Where(m =>
                (m.IdSender == me && m.IdReceiver == request.PeerId)
                || (m.IdSender == request.PeerId && m.IdReceiver == me));

        if (request.BeforeId is > 0)
        {
            var cursor = await Context.Messages.AsNoTracking()
                .Where(m => m.Id == request.BeforeId.Value)
                .Select(m => new { m.Id, m.CreationDate })
                .FirstOrDefaultAsync(ct);

            if (cursor is null)
                throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

            query = query.Where(m =>
                m.CreationDate < cursor.CreationDate
                || (m.CreationDate == cursor.CreationDate && m.Id < cursor.Id));
        }

        return await query
            .OrderByDescending(m => m.CreationDate)
            .ThenByDescending(m => m.Id)
            .Take(take)
            .Select(m => new MessageThreadDto
            {
                Id = m.Id,
                PublicId = m.PublicId,
                Content = m.Content,
                IdSender = m.IdSender,
                IdReceiver = m.IdReceiver,
                IsRead = m.IsRead,
                CreationDate = m.CreationDate,
                ParentMessageId = m.ParentMessageId,
                ParentContent = m.ParentMessage != null ? m.ParentMessage.Content : null,
            })
            .ToListAsync(ct);
    }

    private async Task<int> CreateMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<Message>(message.Data);
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new BadRequestException("CONTENT_MANDATORY", "Content mandatory");
        if (request.IdReceiver <= 0)
            throw new BadRequestException("RECEIVER_MANDATORY", "Receiver mandatory");
        if (request.IdReceiver == me)
            throw new BadRequestException("INVALID_RECEIVER", "Cannot message yourself");

        var peers = await Context.Users.AsNoTracking()
            .Where(u => u.Id == me || u.Id == request.IdReceiver)
            .Select(u => new { u.Id, u.IdKeycloak, u.Nickname, u.Discriminator })
            .ToListAsync(ct);

        var sender = peers.FirstOrDefault(u => u.Id == me)
            ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
        var receiver = peers.FirstOrDefault(u => u.Id == request.IdReceiver)
            ?? throw new NotFoundException("RECEIVER_NOT_FOUND", "Receiver not found");

        var blocked = await Context.Friends.AsNoTracking().AnyAsync(
            f =>
                f.IdFriendStatus == StatusBlocked
                && ((f.IdFriendAsking == me && f.IdFriendReceive == request.IdReceiver)
                    || (f.IdFriendAsking == request.IdReceiver && f.IdFriendReceive == me)),
            ct);
        if (blocked)
            throw new ForbiddenException("BLOCKED", "Cannot message a blocked player");

        var parent = await ResolveParentAsync(me, request.IdReceiver, request.ParentMessageId, ct);

        var now = DateTime.UtcNow;
        var entity = new Message
        {
            PublicId = Guid.NewGuid(),
            Content = request.Content.Trim(),
            IdSender = me,
            IdReceiver = request.IdReceiver,
            IsRead = false,
            ParentMessageId = parent?.Id,
            CreationDate = now,
            ModificationDate = now,
        };

        await Context.Messages.AddAsync(entity, ct);
        await Context.SaveChangesAsync(ct);

        try
        {
            await realtimePublisher.PublishAsync(
                new MessageCreatedRealtimeEvent
                {
                    SenderKeycloak = sender.IdKeycloak.ToString(),
                    ReceiverKeycloak = receiver.IdKeycloak.ToString(),
                    Message = new MessageRealtimePayload
                    {
                        Id = entity.Id,
                        PublicId = entity.PublicId,
                        Content = entity.Content,
                        IdSender = entity.IdSender,
                        IdReceiver = entity.IdReceiver,
                        IsRead = entity.IsRead,
                        CreationDate = UtcDateTimeJsonConverter.AsUtc(entity.CreationDate),
                        ParentMessageId = entity.ParentMessageId,
                        ParentContent = parent?.Content,
                    },
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish message.created realtime event for message {MessageId}.", entity.Id);
        }

        return entity.Id;
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
        var unread = await Context.Messages
            .Where(m => m.IdReceiver == me && m.IdSender == request.PeerId && !m.IsRead)
            .ToListAsync(ct);

        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ModificationDate = now;
        }

        await Context.SaveChangesAsync(ct);
        return unread.Count;
    }

    private async Task<Message> GetMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var entity = await ResolveAsync(message, ct);
        if (entity.IdSender != me && entity.IdReceiver != me)
            throw new ForbiddenException("FORBIDDEN", "Not a participant of this conversation");
        return entity;
    }

    private async Task<ParentQuote?> ResolveParentAsync(int me, int peerId, int? parentMessageId, CancellationToken ct)
    {
        if (parentMessageId is not > 0)
            return null;

        var row = await Context.Messages.AsNoTracking()
            .Where(m => m.Id == parentMessageId.Value)
            .Select(m => new { m.Id, m.IdSender, m.IdReceiver, m.Content })
            .FirstOrDefaultAsync(ct);

        if (row is null)
            throw new NotFoundException("PARENT_NOT_FOUND", "Parent message not found");

        var sameThread =
            (row.IdSender == me && row.IdReceiver == peerId)
            || (row.IdSender == peerId && row.IdReceiver == me);
        if (!sameThread)
            throw new BadRequestException("INVALID_PARENT", "Parent message is not in this conversation");

        return new ParentQuote(row.Id, row.IdSender, row.IdReceiver, row.Content);
    }

    private async Task<int> RequireCallerUserIdAsync(BusMessage message, CancellationToken ct)
    {
        if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");

        var user = await Context.Users.AsNoTracking()
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
        public int? BeforeId { get; set; }
        public int? Take { get; set; }
    }

    private sealed record ParentQuote(int Id, int IdSender, int IdReceiver, string Content);

    private sealed class MessageThreadDto
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; }
        public string Content { get; set; } = "";
        public int IdSender { get; set; }
        public int IdReceiver { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreationDate { get; set; }
        public int? ParentMessageId { get; set; }
        public string? ParentContent { get; set; }
    }

    private sealed class MessageConversationDto
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; }
        public string Content { get; set; } = "";
        public int IdSender { get; set; }
        public int IdReceiver { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreationDate { get; set; }
        public int UnreadCount { get; set; }
    }
}
