using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Models;
using Platform.Consumer.Notifications;
using Platform.Consumer.Realtime;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;
using ILogger = Serilog.ILogger;

namespace Platform.Consumer.Services.Data;

public class FriendsService(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher,
    INotificationWriter notificationWriter,
    ILogger logger)
    : GenericDataService<GamersCommunityDbContext, Friend>(context, "Friends")
{
    private const int StatusPending = 1;
    private const int StatusAccepted = 2;
    private const int StatusRefused = 3;
    private const int StatusBlocked = 4;

    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        switch (message.Action.ToUpperInvariant())
        {
            case "LIST":
                return JsonSafe.Serialize(await ListMineAsync(message, ct));
            case "CREATE":
                return JsonSafe.Serialize(await CreateRequestAsync(message, ct));
            case "UPDATE":
                return JsonSafe.Serialize(await UpdateRelationAsync(message, ct));
            default:
                return await base.HandleAsync(message, ct);
        }
    }

    private async Task<List<FriendRelationDto>> ListMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var rows = await Context.Friends.AsNoTracking()
            .Where(f => f.IdFriendAsking == me || f.IdFriendReceive == me)
            .OrderByDescending(f => f.ModificationDate)
            .ToListAsync(ct);

        var peerIds = rows
            .Select(f => f.IdFriendAsking == me ? f.IdFriendReceive : f.IdFriendAsking)
            .Distinct()
            .ToList();

        var peers = await Context.Users.AsNoTracking()
            .Where(u => peerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, ct);

        return rows.Select(f =>
        {
            var peerId = f.IdFriendAsking == me ? f.IdFriendReceive : f.IdFriendAsking;
            peers.TryGetValue(peerId, out var peer);
            return ToDto(f, peerId, peer);
        }).ToList();
    }

    private async Task<int> CreateRequestAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<Friend>(message.Data);
        if (request.IdFriendReceive <= 0)
            throw new BadRequestException("RECEIVER_MANDATORY", "Receiver mandatory");
        if (request.IdFriendReceive == me)
            throw new BadRequestException("INVALID_RECEIVER", "Cannot friend yourself");

        var receiver = await Context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.IdFriendReceive, ct)
            ?? throw new NotFoundException("RECEIVER_NOT_FOUND", "Receiver not found");

        var existing = await Context.Friends
            .FirstOrDefaultAsync(
                f => (f.IdFriendAsking == me && f.IdFriendReceive == request.IdFriendReceive)
                     || (f.IdFriendAsking == request.IdFriendReceive && f.IdFriendReceive == me),
                ct);

        Friend entity;
        var now = DateTime.UtcNow;

        if (existing is not null)
        {
            if (existing.IdFriendStatus == StatusBlocked)
                throw new ForbiddenException("BLOCKED", "Friendship is blocked");
            if (existing.IdFriendStatus is StatusPending or StatusAccepted)
                throw new BadRequestException("ALREADY_EXISTS", "Friendship already exists");

            existing.IdFriendAsking = me;
            existing.IdFriendReceive = request.IdFriendReceive;
            existing.IdFriendStatus = StatusPending;
            existing.ModificationDate = now;
            entity = existing;
        }
        else
        {
            entity = new Friend
            {
                PublicId = Guid.NewGuid(),
                IdFriendAsking = me,
                IdFriendReceive = request.IdFriendReceive,
                IdFriendStatus = StatusPending,
                CreationDate = now,
                ModificationDate = now,
            };
            await Context.Friends.AddAsync(entity, ct);
        }

        await Context.SaveChangesAsync(ct);

        var meUser = await Context.Users.AsNoTracking().FirstAsync(u => u.Id == me, ct);
        await PublishFriendUpdatedAsync(meUser.IdKeycloak, receiver.IdKeycloak, entity, ct);

        if (entity.IdFriendStatus == StatusPending)
        {
            await notificationWriter.CreateAsync(
                request.IdFriendReceive,
                NotificationKinds.FriendRequest,
                NotificationMessageIds.FriendRequestTitle,
                NotificationMessageIds.FriendRequestBody,
                $"/users/{meUser.PublicId}",
                new
                {
                    peerId = me,
                    friendshipPublicId = entity.PublicId,
                    peerNickname = meUser.Nickname,
                    peerDiscriminator = meUser.Discriminator,
                },
                ct);
        }

        return entity.Id;
    }

    private async Task<bool> UpdateRelationAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<Friend>(message.Data);
        var friend = message.PublicId is Guid publicId
            ? await Context.Friends.FirstOrDefaultAsync(f => f.PublicId == publicId, ct)
            : message.Id is int id
                ? await Context.Friends.FirstOrDefaultAsync(f => f.Id == id, ct)
                : null;

        if (friend is null)
            throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        if (friend.IdFriendAsking != me && friend.IdFriendReceive != me)
            throw new ForbiddenException("FORBIDDEN", "Not a participant of this friendship");

        EnsureAllowedTransition(friend, me, request.IdFriendStatus);
        var previous = friend.IdFriendStatus;
        var peerId = friend.IdFriendAsking == me ? friend.IdFriendReceive : friend.IdFriendAsking;

        if (request.IdFriendStatus == StatusBlocked)
        {
            friend.IdFriendAsking = me;
            friend.IdFriendReceive = peerId;
        }

        friend.IdFriendStatus = request.IdFriendStatus;
        friend.ModificationDate = DateTime.UtcNow;
        await Context.SaveChangesAsync(ct);

        var peers = await Context.Users.AsNoTracking()
            .Where(u => u.Id == friend.IdFriendAsking || u.Id == friend.IdFriendReceive)
            .ToListAsync(ct);
        var asking = peers.First(u => u.Id == friend.IdFriendAsking);
        var receiving = peers.First(u => u.Id == friend.IdFriendReceive);
        await PublishFriendUpdatedAsync(asking.IdKeycloak, receiving.IdKeycloak, friend, ct);

        if (previous == StatusPending && request.IdFriendStatus == StatusAccepted)
        {
            await notificationWriter.CreateAsync(
                friend.IdFriendAsking,
                NotificationKinds.FriendAccepted,
                NotificationMessageIds.FriendAcceptedTitle,
                NotificationMessageIds.FriendAcceptedBody,
                $"/users/{receiving.PublicId}",
                new
                {
                    peerId = friend.IdFriendReceive,
                    friendshipPublicId = friend.PublicId,
                    peerNickname = receiving.Nickname,
                    peerDiscriminator = receiving.Discriminator,
                },
                ct);
        }

        return true;
    }

    private async Task PublishFriendUpdatedAsync(
        Guid askingKeycloak,
        Guid receivingKeycloak,
        Friend friend,
        CancellationToken ct)
    {
        try
        {
            await realtimePublisher.PublishAsync(
                new FriendUpdatedRealtimeEvent
                {
                    AskingKeycloak = askingKeycloak.ToString(),
                    ReceivingKeycloak = receivingKeycloak.ToString(),
                    IdFriendAsking = friend.IdFriendAsking,
                    IdFriendReceive = friend.IdFriendReceive,
                    IdFriendStatus = friend.IdFriendStatus,
                    PublicId = friend.PublicId,
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish friend.updated realtime event for friendship {PublicId}.", friend.PublicId);
        }
    }

    private static FriendRelationDto ToDto(Friend friend, int peerId, User? peer) => new()
    {
        Id = friend.Id,
        PublicId = friend.PublicId,
        CreationDate = friend.CreationDate,
        ModificationDate = friend.ModificationDate,
        IdFriendAsking = friend.IdFriendAsking,
        IdFriendReceive = friend.IdFriendReceive,
        IdFriendStatus = friend.IdFriendStatus,
        PeerId = peerId,
        PeerPublicId = peer?.PublicId ?? Guid.Empty,
        PeerNickname = peer?.Nickname ?? $"Player #{peerId}",
        PeerDiscriminator = peer?.Discriminator ?? "0000",
        PeerAvatarUrl = peer?.AvatarUrl ?? "",
    };

    private static void EnsureAllowedTransition(Friend friend, int me, int nextStatus)
    {
        var isReceiver = friend.IdFriendReceive == me;
        var isPending = friend.IdFriendStatus == StatusPending;
        var isBlocker = friend.IdFriendStatus == StatusBlocked && friend.IdFriendAsking == me;

        switch (nextStatus)
        {
            case StatusAccepted when isPending && isReceiver:
            case StatusAccepted when isBlocker:
            case StatusRefused when isPending && isReceiver:
            case StatusBlocked:
                return;
            default:
                throw new BadRequestException("INVALID_STATUS", "Friendship status transition is not allowed");
        }
    }

    private async Task<int> RequireCallerUserIdAsync(BusMessage message, CancellationToken ct)
    {
        if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");

        var user = await Context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdKeycloak == idKeycloak, ct);

        return user?.Id ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
    }
}
