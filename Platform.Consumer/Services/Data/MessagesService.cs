using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Notifications;
using Platform.Consumer.Realtime;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;
using ILogger = Serilog.ILogger;

namespace Platform.Consumer.Services.Data;

public class MessagesService(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher,
    INotificationWriter notificationWriter,
    ILogger logger)
    : GenericDataService<GamersCommunityDbContext, Message>(context, "Messages")
{
    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        switch (message.Action.ToUpperInvariant())
        {
            case "LIST":
                return JsonSafe.Serialize(await ListMineAsync(message, ct));
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

    private async Task<List<Message>> ListMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        return await Context.Messages.AsNoTracking()
            .Where(m => m.IdSender == me || m.IdReceiver == me)
            .OrderByDescending(m => m.CreationDate)
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

        var now = DateTime.UtcNow;
        var entity = new Message
        {
            PublicId = Guid.NewGuid(),
            Content = request.Content.Trim(),
            IdSender = me,
            IdReceiver = request.IdReceiver,
            IsRead = false,
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
                        CreationDate = entity.CreationDate,
                    },
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish message.created realtime event for message {MessageId}.", entity.Id);
        }

        await notificationWriter.CreateAsync(
            request.IdReceiver,
            NotificationKinds.Message,
            "New whisper",
            $"{sender.Nickname}#{sender.Discriminator}: {Truncate(entity.Content, 120)}",
            "/social/messages",
            new { peerId = me, messagePublicId = entity.PublicId },
            ct);

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

        var peerToken = $"\"peerId\":{request.PeerId}";
        var relatedNotifications = await Context.Notifications
            .Where(n =>
                n.IdUser == me
                && !n.IsRead
                && n.Kind == NotificationKinds.Message
                && n.PayloadJson != null
                && n.PayloadJson.Contains(peerToken))
            .ToListAsync(ct);

        foreach (var notification in relatedNotifications)
        {
            notification.IsRead = true;
            notification.ModificationDate = now;
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

    private static string Truncate(string value, int max) =>
        value.Length <= max ? value : value[..(max - 1)] + "…";

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
}
