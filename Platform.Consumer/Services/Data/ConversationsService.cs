using GamersCommunity.Core.Enums;
using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Platform.Consumer.Configuration;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Consumer.Serialization;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;
using ILogger = Serilog.ILogger;

namespace Platform.Consumer.Services.Data;

public class ConversationsService(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher,
    IMessageContentCipher cipher,
    IOptions<AppSettings> appSettings,
    ILogger logger) : IBusService
{
    private const int StatusAccepted = 2;
    private const int StatusBlocked = 4;
    private const int MaxGroupMembers = 32;
    private const int DisplayTitleMax = 42;

    BusServiceTypeEnum IBusService.Type => BusServiceTypeEnum.DATA;

    public string Resource => "Conversations";

    public async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        switch (message.Action.ToUpperInvariant())
        {
            case "LIST":
                return JsonSafe.Serialize(await ListMineAsync(message, ct));
            case "GET":
                return JsonSafe.Serialize(await GetMineAsync(message, ct));
            case "CREATE":
                return JsonSafe.Serialize(await CreateMineAsync(message, ct));
            case "UPDATE":
                return JsonSafe.Serialize(await UpdateMineAsync(message, ct));
            case "ADDMEMBERS":
                return JsonSafe.Serialize(await AddMembersAsync(message, ct));
            case "REMOVEMEMBERS":
            {
                var remaining = await RemoveMembersAsync(message, ct);
                return remaining is null ? "null" : JsonSafe.Serialize(remaining);
            }
            case "DELETE":
                await DeleteMineAsync(message, ct);
                return JsonSafe.Serialize(true);
            default:
                throw new InternalServerErrorException("ACTION_NOT_IMPLEMENTED", $"Action {message.Action} not implemented");
        }
    }

    private async Task<List<ConversationDto>> ListMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var memberships = await context.ConversationMembers.AsNoTracking()
            .Where(m => m.IdUser == me)
            .ToListAsync(ct);
        if (memberships.Count == 0)
            return [];

        var convIds = memberships.Select(m => m.IdConversation).ToList();
        var conversations = await context.Conversations.AsNoTracking()
            .Where(c => convIds.Contains(c.Id))
            .ToListAsync(ct);
        var members = await LoadMembersAsync(convIds, ct);
        var messages = await context.Messages.AsNoTracking()
            .Where(m => convIds.Contains(m.IdConversation))
            .Select(m => new { m.IdConversation, m.IdSender, m.Content, m.CreationDate, m.PublicId, m.Kind })
            .ToListAsync(ct);

        var result = new List<ConversationDto>(conversations.Count);
        foreach (var conversation in conversations)
        {
            var membership = memberships.First(m => m.IdConversation == conversation.Id);
            var convMembers = members.Where(m => m.IdConversation == conversation.Id).ToList();
            var visible = messages
                .Where(m => m.IdConversation == conversation.Id && m.CreationDate >= membership.JoinedAt)
                .OrderByDescending(m => m.CreationDate)
                .ThenByDescending(m => m.PublicId)
                .ToList();
            var last = visible.FirstOrDefault();
            var unread = visible.Count(m =>
                m.IdSender != me
                && m.Kind == MessageKind.Text
                && (membership.LastReadAt is null || m.CreationDate > membership.LastReadAt));
            var lastPlain = last is null ? null : cipher.Decrypt(last.Content);

            result.Add(MapDto(me, conversation, convMembers, lastPlain, last?.CreationDate, unread, includeMembers: false));
        }

        return result
            .OrderByDescending(c => c.LastDate ?? c.CreationDate)
            .ToList();
    }

    private async Task<ConversationDto> GetMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var conversation = await RequireConversationAsync(message, ct);
        var membership = await RequireMemberAsync(conversation.Id, me, ct);
        var members = await LoadMembersAsync([conversation.Id], ct);
        var visible = await context.Messages.AsNoTracking()
            .Where(m => m.IdConversation == conversation.Id && m.CreationDate >= membership.JoinedAt)
            .OrderByDescending(m => m.CreationDate)
            .ThenByDescending(m => m.PublicId)
            .Select(m => new { m.Content, m.CreationDate, m.IdSender, m.PublicId, m.Kind })
            .ToListAsync(ct);
        var last = visible.FirstOrDefault();
        var unread = visible.Count(m =>
            m.IdSender != me
            && m.Kind == MessageKind.Text
            && (membership.LastReadAt is null || m.CreationDate > membership.LastReadAt));
        var lastPlain = last is null ? null : cipher.Decrypt(last.Content);
        return MapDto(me, conversation, members, lastPlain, last?.CreationDate, unread, includeMembers: true, membership);
    }

    private async Task<ConversationDto> CreateMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<CreateConversationRequest>(message.Data);
        var others = (request.MemberIds ?? [])
            .Where(id => id > 0 && id != me)
            .Distinct()
            .ToList();
        if (others.Count == 0)
            throw new BadRequestException("MEMBERS_MANDATORY", "Select at least one contact");

        if (others.Count == 1)
            return await EnsureDmAsync(me, others[0], ct);

        return await CreateGroupAsync(me, others, request.Title, request.AvatarId, ct);
    }

    private async Task<ConversationDto> UpdateMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var conversation = await RequireTrackedConversationAsync(message, ct);
        await RequireOwnerAsync(conversation, me, ct);
        if (conversation.Kind != ConversationKind.Group)
            throw new BadRequestException("NOT_A_GROUP", "Only groups can be renamed");
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<UpdateConversationRequest>(message.Data);
        if (request.Title is not null)
            conversation.Title = NormalizeTitle(request.Title);
        if (request.AvatarId is int avatarId)
            conversation.PictureUrl = BuildGroupAvatarUrl(avatarId);

        conversation.ModificationDate = DateTime.UtcNow;
        await context.SaveChangesAsync(ct);
        await PublishUpdatedAsync(conversation.PublicId, conversation.Id, extraUserIds: [], ct);
        return await GetMineAsync(message, ct);
    }

    private async Task<ConversationDto> AddMembersAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var conversation = await RequireTrackedConversationAsync(message, ct);
        await RequireOwnerAsync(conversation, me, ct);
        if (conversation.Kind != ConversationKind.Group)
            throw new BadRequestException("NOT_A_GROUP", "Cannot add members to a direct chat");
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<MembersRequest>(message.Data);
        var toAdd = (request.MemberIds ?? []).Where(id => id > 0 && id != me).Distinct().ToList();
        if (toAdd.Count == 0)
            throw new BadRequestException("MEMBERS_MANDATORY", "Select at least one contact");

        var existingIds = await context.ConversationMembers.AsNoTracking()
            .Where(m => m.IdConversation == conversation.Id)
            .Select(m => m.IdUser)
            .ToListAsync(ct);
        toAdd = toAdd.Where(id => !existingIds.Contains(id)).ToList();
        if (toAdd.Count == 0)
            throw new BadRequestException("ALREADY_MEMBER", "Those players are already in the group");
        if (existingIds.Count + toAdd.Count > MaxGroupMembers)
            throw new BadRequestException("GROUP_FULL", $"A group cannot exceed {MaxGroupMembers} members");

        await EnsureAcceptedFriendsAsync(me, toAdd, ct);

        var now = DateTime.UtcNow;
        foreach (var userId in toAdd)
        {
            await context.ConversationMembers.AddAsync(new ConversationMember
            {
                IdConversation = conversation.Id,
                IdUser = userId,
                JoinedAt = now,
                LastReadAt = now,
                IsOwner = false,
                CreationDate = now,
                ModificationDate = now,
            }, ct);
        }

        conversation.ModificationDate = now;
        var joinEvents = await QueueMembershipEventsAsync(conversation, toAdd, MessageKind.MemberJoined, now, ct);
        await context.SaveChangesAsync(ct);
        await PublishMembershipEventsAsync(conversation, joinEvents, ct);
        await PublishUpdatedAsync(conversation.PublicId, conversation.Id, toAdd, ct);
        return await GetMineAsync(message, ct);
    }

    private async Task DeleteMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var conversation = await RequireTrackedConversationAsync(message, ct);
        await RequireOwnerAsync(conversation, me, ct);
        if (conversation.Kind != ConversationKind.Group)
            throw new BadRequestException("NOT_A_GROUP", "Only groups can be deleted");

        await DeleteGroupAsync(conversation, ct);
    }

    private async Task DeleteGroupAsync(Conversation conversation, CancellationToken ct)
    {
        var memberIds = await context.ConversationMembers.AsNoTracking()
            .Where(m => m.IdConversation == conversation.Id)
            .Select(m => m.IdUser)
            .ToListAsync(ct);
        var keycloaks = await LoadKeycloakSubjectsAsync(memberIds, ct);

        context.Conversations.Remove(conversation);
        await context.SaveChangesAsync(ct);

        if (keycloaks.Length == 0)
            return;

        try
        {
            await realtimePublisher.PublishAsync(
                new ConversationUpdatedRealtimeEvent
                {
                    RecipientKeycloaks = [.. keycloaks],
                    ConversationPublicId = conversation.PublicId,
                    Deleted = true,
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish conversation.updated for deleted {ConversationId}.", conversation.PublicId);
        }
    }

    private async Task<ConversationDto?> RemoveMembersAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var conversation = await RequireTrackedConversationAsync(message, ct);
        await RequireOwnerAsync(conversation, me, ct);
        if (conversation.Kind != ConversationKind.Group)
            throw new BadRequestException("NOT_A_GROUP", "Cannot remove members from a direct chat");
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<MembersRequest>(message.Data);
        var toRemove = (request.MemberIds ?? []).Where(id => id > 0).Distinct().ToList();
        if (toRemove.Contains(me) || (conversation.IdOwner is int ownerId && toRemove.Contains(ownerId)))
            throw new BadRequestException("CANNOT_REMOVE_OWNER", "The group owner cannot be removed");

        var members = await context.ConversationMembers
            .Where(m => m.IdConversation == conversation.Id)
            .ToListAsync(ct);
        var removing = members.Where(m => toRemove.Contains(m.IdUser)).ToList();
        if (removing.Count == 0)
            throw new NotFoundException("MEMBER_NOT_FOUND", "Member not found");
        if (members.Count - removing.Count < 2)
        {
            await DeleteGroupAsync(conversation, ct);
            return null;
        }

        context.ConversationMembers.RemoveRange(removing);
        conversation.ModificationDate = DateTime.UtcNow;
        var leaveEvents = await QueueMembershipEventsAsync(
            conversation,
            removing.Select(m => m.IdUser).ToList(),
            MessageKind.MemberLeft,
            conversation.ModificationDate,
            ct);
        await context.SaveChangesAsync(ct);
        await PublishMembershipEventsAsync(conversation, leaveEvents, ct);
        await PublishUpdatedAsync(conversation.PublicId, conversation.Id, removing.Select(m => m.IdUser), ct);
        return await GetMineAsync(message, ct);
    }

    private async Task<ConversationDto> EnsureDmAsync(int me, int peerId, CancellationToken ct)
    {
        if (await IsBlockedAsync(me, peerId, ct))
            throw new ForbiddenException("BLOCKED", "Cannot message a blocked player");

        var peer = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == peerId, ct)
            ?? throw new NotFoundException("MEMBER_NOT_FOUND", "Contact not found");

        var existingId = await (
            from mine in context.ConversationMembers.AsNoTracking()
            join theirs in context.ConversationMembers.AsNoTracking()
                on mine.IdConversation equals theirs.IdConversation
            join conv in context.Conversations.AsNoTracking()
                on mine.IdConversation equals conv.Id
            where mine.IdUser == me && theirs.IdUser == peerId && conv.Kind == ConversationKind.Dm
            select conv.Id).FirstOrDefaultAsync(ct);

        if (existingId != 0)
        {
            var existing = await context.Conversations.AsNoTracking().FirstAsync(c => c.Id == existingId, ct);
            var members = await LoadMembersAsync([existingId], ct);
            return MapDto(me, existing, members, lastContent: null, lastDate: null, unreadCount: 0, includeMembers: true);
        }

        var now = DateTime.UtcNow;
        var conversation = new Conversation
        {
            PublicId = Guid.NewGuid(),
            Kind = ConversationKind.Dm,
            CreationDate = now,
            ModificationDate = now,
        };
        await context.Conversations.AddAsync(conversation, ct);
        await context.SaveChangesAsync(ct);

        await context.ConversationMembers.AddRangeAsync(
        [
            NewMember(conversation.Id, me, now, isOwner: false),
            NewMember(conversation.Id, peer.Id, now, isOwner: false),
        ], ct);
        await context.SaveChangesAsync(ct);

        var createdMembers = await LoadMembersAsync([conversation.Id], ct);
        return MapDto(me, conversation, createdMembers, lastContent: null, lastDate: null, unreadCount: 0, includeMembers: true);
    }

    private async Task<ConversationDto> CreateGroupAsync(int me, List<int> others, string? title, int? avatarId, CancellationToken ct)
    {
        if (others.Count + 1 > MaxGroupMembers)
            throw new BadRequestException("GROUP_FULL", $"A group cannot exceed {MaxGroupMembers} members");

        await EnsureAcceptedFriendsAsync(me, others, ct);

        var now = DateTime.UtcNow;
        var conversation = new Conversation
        {
            PublicId = Guid.NewGuid(),
            Kind = ConversationKind.Group,
            Title = NormalizeTitle(title),
            PictureUrl = avatarId is int id ? BuildGroupAvatarUrl(id) : null,
            IdOwner = me,
            CreationDate = now,
            ModificationDate = now,
        };
        await context.Conversations.AddAsync(conversation, ct);
        await context.SaveChangesAsync(ct);

        var memberRows = new List<ConversationMember> { NewMember(conversation.Id, me, now, isOwner: true) };
        memberRows.AddRange(others.Select(userId => NewMember(conversation.Id, userId, now, isOwner: false)));
        await context.ConversationMembers.AddRangeAsync(memberRows, ct);
        await context.SaveChangesAsync(ct);
        await PublishUpdatedAsync(conversation.PublicId, conversation.Id, extraUserIds: [], ct);

        var members = await LoadMembersAsync([conversation.Id], ct);
        return MapDto(me, conversation, members, lastContent: null, lastDate: null, unreadCount: 0, includeMembers: true);
    }

    private async Task EnsureAcceptedFriendsAsync(int me, IReadOnlyCollection<int> others, CancellationToken ct)
    {
        var users = await context.Users.AsNoTracking()
            .Where(u => others.Contains(u.Id))
            .Select(u => u.Id)
            .ToListAsync(ct);
        if (users.Count != others.Count)
            throw new NotFoundException("MEMBER_NOT_FOUND", "Contact not found");

        foreach (var other in others)
        {
            if (await IsBlockedAsync(me, other, ct))
                throw new ForbiddenException("BLOCKED", "Cannot add a blocked player");
            if (!await IsAcceptedFriendAsync(me, other, ct))
                throw new ForbiddenException("NOT_A_CONTACT", "Group members must be accepted friends");
        }
    }

    private Task<bool> IsBlockedAsync(int a, int b, CancellationToken ct) =>
        context.Friends.AsNoTracking().AnyAsync(
            f => f.IdFriendStatus == StatusBlocked
                && ((f.IdFriendAsking == a && f.IdFriendReceive == b)
                    || (f.IdFriendAsking == b && f.IdFriendReceive == a)),
            ct);

    private Task<bool> IsAcceptedFriendAsync(int a, int b, CancellationToken ct) =>
        context.Friends.AsNoTracking().AnyAsync(
            f => f.IdFriendStatus == StatusAccepted
                && ((f.IdFriendAsking == a && f.IdFriendReceive == b)
                    || (f.IdFriendAsking == b && f.IdFriendReceive == a)),
            ct);

    private async Task<List<MemberRow>> LoadMembersAsync(IReadOnlyCollection<int> conversationIds, CancellationToken ct)
    {
        return await (
            from m in context.ConversationMembers.AsNoTracking()
            join u in context.Users.AsNoTracking() on m.IdUser equals u.Id
            where conversationIds.Contains(m.IdConversation)
            select new MemberRow(
                m.IdConversation,
                u.Id,
                u.PublicId,
                u.Nickname,
                u.Discriminator,
                u.AvatarUrl,
                m.IsOwner,
                m.JoinedAt)).ToListAsync(ct);
    }

    private ConversationDto MapDto(
        int me,
        Conversation conversation,
        List<MemberRow> members,
        string? lastContent,
        DateTime? lastDate,
        int unreadCount,
        bool includeMembers,
        ConversationMember? membership = null)
    {
        var peer = conversation.Kind == ConversationKind.Dm
            ? members.FirstOrDefault(m => m.IdUser != me)
            : null;
        var isOwner = membership?.IsOwner ?? members.Any(m => m.IdUser == me && m.IsOwner);

        return new ConversationDto
        {
            PublicId = conversation.PublicId,
            Kind = conversation.Kind,
            Title = conversation.Title,
            DisplayTitle = BuildDisplayTitle(conversation.Title, me, members),
            PictureUrl = conversation.PictureUrl,
            IdOwner = conversation.IdOwner,
            IsOwner = isOwner,
            CreationDate = conversation.CreationDate,
            LastMessage = lastContent,
            LastDate = lastDate,
            UnreadCount = unreadCount,
            PeerId = peer?.IdUser,
            PeerPublicId = peer?.PublicId,
            PeerNickname = peer?.Nickname,
            PeerDiscriminator = peer?.Discriminator,
            PeerAvatarUrl = peer?.AvatarUrl,
            Members = includeMembers
                ? members.Select(m => new ConversationMemberDto
                {
                    Id = m.IdUser,
                    PublicId = m.PublicId,
                    Nickname = m.Nickname,
                    Discriminator = m.Discriminator,
                    AvatarUrl = m.AvatarUrl,
                    IsOwner = m.IsOwner,
                    JoinedAt = m.JoinedAt,
                }).ToList()
                : [],
        };
    }

    private static string BuildDisplayTitle(string? title, int me, IReadOnlyList<MemberRow> members)
    {
        if (!string.IsNullOrWhiteSpace(title))
            return title.Trim();

        var names = members.Where(m => m.IdUser != me).Select(m => m.Nickname).OrderBy(n => n, StringComparer.OrdinalIgnoreCase).ToList();
        if (names.Count == 0)
            return members.FirstOrDefault()?.Nickname ?? "";

        var joined = string.Join(", ", names);
        return joined.Length <= DisplayTitleMax ? joined : $"{joined[..(DisplayTitleMax - 1)].TrimEnd()}…";
    }

    private static ConversationMember NewMember(int conversationId, int userId, DateTime now, bool isOwner) => new()
    {
        IdConversation = conversationId,
        IdUser = userId,
        JoinedAt = now,
        LastReadAt = now,
        IsOwner = isOwner,
        CreationDate = now,
        ModificationDate = now,
    };

    private async Task<List<MembershipEvent>> QueueMembershipEventsAsync(
        Conversation conversation,
        IReadOnlyCollection<int> userIds,
        string kind,
        DateTime now,
        CancellationToken ct)
    {
        if (userIds.Count == 0)
            return [];

        var users = await context.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.PublicId, u.Nickname, u.Discriminator, u.AvatarUrl })
            .ToListAsync(ct);

        var events = new List<MembershipEvent>(users.Count);
        foreach (var user in users)
        {
            var handle = string.IsNullOrWhiteSpace(user.Discriminator)
                ? user.Nickname
                : $"{user.Nickname}#{user.Discriminator}";
            var plaintext = kind == MessageKind.MemberJoined
                ? $"{handle} joined the group."
                : $"{handle} left the group.";
            var entity = new Message
            {
                PublicId = Guid.NewGuid(),
                Content = cipher.Encrypt(plaintext),
                Kind = kind,
                IdConversation = conversation.Id,
                IdSender = user.Id,
                CreationDate = now,
                ModificationDate = now,
            };
            await context.Messages.AddAsync(entity, ct);
            events.Add(new MembershipEvent(entity, plaintext, user.PublicId, user.Nickname, user.Discriminator, user.AvatarUrl));
        }

        return events;
    }

    private async Task PublishMembershipEventsAsync(
        Conversation conversation,
        IReadOnlyList<MembershipEvent> events,
        CancellationToken ct)
    {
        if (events.Count == 0)
            return;

        var recipients = await LoadKeycloakSubjectsAsync(
            await context.ConversationMembers.AsNoTracking()
                .Where(m => m.IdConversation == conversation.Id)
                .Select(m => m.IdUser)
                .ToListAsync(ct),
            ct);
        if (recipients.Length == 0)
            return;

        foreach (var item in events)
        {
            try
            {
                await realtimePublisher.PublishAsync(
                    new MessageCreatedRealtimeEvent
                    {
                        RecipientKeycloaks = recipients,
                        Message = new MessageRealtimePayload
                        {
                            PublicId = item.Entity.PublicId,
                            ConversationPublicId = conversation.PublicId,
                            Content = item.Plaintext,
                            IdSender = item.Entity.IdSender,
                            SenderPublicId = item.SenderPublicId,
                            SenderNickname = item.SenderNickname,
                            SenderDiscriminator = item.SenderDiscriminator,
                            SenderAvatarUrl = item.SenderAvatarUrl,
                            CreationDate = UtcDateTimeJsonConverter.AsUtc(item.Entity.CreationDate),
                            Kind = item.Entity.Kind,
                        },
                    },
                    ct);
            }
            catch (Exception ex)
            {
                logger.Warning(ex, "Failed to publish membership event {MessageId}.", item.Entity.PublicId);
            }
        }
    }

    private sealed record MembershipEvent(
        Message Entity,
        string Plaintext,
        Guid SenderPublicId,
        string SenderNickname,
        string SenderDiscriminator,
        string SenderAvatarUrl);

    private string? BuildGroupAvatarUrl(int avatarId)
    {
        var settings = appSettings.Value.AvatarSettings;
        if (avatarId < settings.MinRangeGroupAvatarId || avatarId > settings.MaxRangeGroupAvatarId)
            throw new BadRequestException("INVALID_AVATAR", $"Group avatar id must be between {settings.MinRangeGroupAvatarId} and {settings.MaxRangeGroupAvatarId}");
        return $"{settings.AvatarBaseUrl.TrimEnd('/')}/g{avatarId}.png";
    }

    private static string? NormalizeTitle(string? title)
    {
        var trimmed = title?.Trim();
        if (string.IsNullOrEmpty(trimmed))
            return null;
        if (trimmed.Length > 80)
            throw new BadRequestException("TITLE_TOO_LONG", "Group name is too long");
        return trimmed;
    }

    private async Task PublishUpdatedAsync(Guid publicId, int conversationId, IEnumerable<int> extraUserIds, CancellationToken ct)
    {
        var memberIds = await context.ConversationMembers.AsNoTracking()
            .Where(m => m.IdConversation == conversationId)
            .Select(m => m.IdUser)
            .ToListAsync(ct);
        var ids = memberIds.Concat(extraUserIds).Distinct().ToList();
        var keycloaks = await LoadKeycloakSubjectsAsync(ids, ct);
        if (keycloaks.Length == 0)
            return;

        try
        {
            await realtimePublisher.PublishAsync(
                new ConversationUpdatedRealtimeEvent
                {
                    RecipientKeycloaks = [.. keycloaks],
                    ConversationPublicId = publicId,
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish conversation.updated for {ConversationId}.", publicId);
        }
    }

    private async Task<Conversation> RequireConversationAsync(BusMessage message, CancellationToken ct)
    {
        if (message.PublicId is not Guid publicId || publicId == Guid.Empty)
            throw new BadRequestException("ID_MANDATORY", "Id mandatory");

        return await context.Conversations.AsNoTracking().FirstOrDefaultAsync(c => c.PublicId == publicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
    }

    private async Task<Conversation> RequireTrackedConversationAsync(BusMessage message, CancellationToken ct)
    {
        if (message.PublicId is not Guid publicId || publicId == Guid.Empty)
            throw new BadRequestException("ID_MANDATORY", "Id mandatory");

        return await context.Conversations.FirstOrDefaultAsync(c => c.PublicId == publicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
    }

    private async Task<ConversationMember> RequireMemberAsync(int conversationId, int userId, CancellationToken ct)
    {
        return await context.ConversationMembers.AsNoTracking()
            .FirstOrDefaultAsync(m => m.IdConversation == conversationId && m.IdUser == userId, ct)
            ?? throw new ForbiddenException("FORBIDDEN", "Not a participant of this conversation");
    }

    private async Task RequireOwnerAsync(Conversation conversation, int userId, CancellationToken ct)
    {
        var member = await RequireMemberAsync(conversation.Id, userId, ct);
        if (!member.IsOwner && conversation.IdOwner != userId)
            throw new ForbiddenException("FORBIDDEN", "Only the group owner can do this");
    }

    private async Task<int> RequireCallerUserIdAsync(BusMessage message, CancellationToken ct)
    {
        if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");

        var user = await context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdKeycloak == idKeycloak, ct);

        return user?.Id ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
    }

    private async Task<string[]> LoadKeycloakSubjectsAsync(IEnumerable<int> userIds, CancellationToken ct)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0)
            return [];

        var keycloaks = await context.Users.AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .Select(u => u.IdKeycloak)
            .ToListAsync(ct);
        return [.. keycloaks.Select(id => id.ToString("D"))];
    }

    private sealed class CreateConversationRequest
    {
        public int[]? MemberIds { get; set; }
        public string? Title { get; set; }
        public int? AvatarId { get; set; }
    }

    private sealed class UpdateConversationRequest
    {
        public string? Title { get; set; }
        public int? AvatarId { get; set; }
    }

    private sealed class MembersRequest
    {
        public int[]? MemberIds { get; set; }
    }

    private sealed record MemberRow(
        int IdConversation,
        int IdUser,
        Guid PublicId,
        string Nickname,
        string Discriminator,
        string AvatarUrl,
        bool IsOwner,
        DateTime JoinedAt);

    private sealed class ConversationDto
    {
        public Guid PublicId { get; set; }
        public string Kind { get; set; } = "";
        public string? Title { get; set; }
        public string DisplayTitle { get; set; } = "";
        public string? PictureUrl { get; set; }
        public int? IdOwner { get; set; }
        public bool IsOwner { get; set; }
        public DateTime CreationDate { get; set; }
        public string? LastMessage { get; set; }
        public DateTime? LastDate { get; set; }
        public int UnreadCount { get; set; }
        public int? PeerId { get; set; }
        public Guid? PeerPublicId { get; set; }
        public string? PeerNickname { get; set; }
        public string? PeerDiscriminator { get; set; }
        public string? PeerAvatarUrl { get; set; }
        public List<ConversationMemberDto> Members { get; set; } = [];
    }

    private sealed class ConversationMemberDto
    {
        public int Id { get; set; }
        public Guid PublicId { get; set; }
        public string Nickname { get; set; } = "";
        public string Discriminator { get; set; } = "";
        public string AvatarUrl { get; set; } = "";
        public bool IsOwner { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
