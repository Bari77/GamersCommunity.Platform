using GamersCommunity.Core.Enums;
using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Platform.Consumer.Configuration;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;

namespace Platform.Tests.Services.Data;

public class ConversationsServiceTests : IClassFixture<FakeDataset>
{
    private static readonly Guid OwnerPublicId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid MemberPublicId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private readonly FakeDataset _dataset;

    public ConversationsServiceTests(FakeDataset dataset) => _dataset = dataset;

    [Fact]
    public async Task Ensure_guild_creates_a_locked_channel_with_the_guild_logo()
    {
        var context = _dataset.CreateFakeContext();
        var service = CreateService(context);
        var picture = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'></svg>";

        var json = await service.HandleAsync(GuildMessage("ENSURE_GUILD", new
        {
            ManagedKey = "wow:guild:11111111-1111-1111-1111-111111111111",
            Title = "Ironforge",
            PictureUrl = picture,
            OwnerUserPublicId = OwnerPublicId,
        }));

        var created = JsonSafe.Deserialize<GuildChannelDto>(json);
        Assert.Equal(ConversationKind.Guild, created?.Kind);
        Assert.Equal("Ironforge", created?.Title);
        Assert.Equal(picture, created?.PictureUrl);
        Assert.True(created?.MembershipLocked);
        Assert.True(await context.ConversationMembers.AnyAsync(m => m.IdUser == 1 && m.IsOwner));
    }

    [Fact]
    public async Task Ensure_guild_is_idempotent_and_refreshes_the_logo()
    {
        var context = _dataset.CreateFakeContext();
        var service = CreateService(context);
        var key = "wow:guild:22222222-2222-2222-2222-222222222222";

        await service.HandleAsync(GuildMessage("ENSURE_GUILD", new
        {
            ManagedKey = key,
            Title = "Old",
            PictureUrl = "https://example.test/old.png",
            OwnerUserPublicId = OwnerPublicId,
        }));

        var json = await service.HandleAsync(GuildMessage("ENSURE_GUILD", new
        {
            ManagedKey = key,
            Title = "New",
            PictureUrl = "https://example.test/new.png",
            OwnerUserPublicId = OwnerPublicId,
        }));

        var updated = JsonSafe.Deserialize<GuildChannelDto>(json);
        Assert.Equal("New", updated?.Title);
        Assert.Equal("https://example.test/new.png", updated?.PictureUrl);
        Assert.Equal(1, await context.Conversations.CountAsync(c => c.ManagedKey == key));
    }

    [Fact]
    public async Task Add_guild_member_does_not_require_friendship()
    {
        var context = _dataset.CreateFakeContext();
        var service = CreateService(context);
        var key = "wow:guild:33333333-3333-3333-3333-333333333333";

        await service.HandleAsync(GuildMessage("ENSURE_GUILD", new
        {
            ManagedKey = key,
            Title = "Stormwind",
            OwnerUserPublicId = OwnerPublicId,
        }));

        await service.HandleAsync(GuildMessage("ADD_GUILD_MEMBER", new
        {
            ManagedKey = key,
            UserPublicId = MemberPublicId,
        }));

        Assert.True(await context.ConversationMembers.AnyAsync(m => m.IdUser == 2));
    }

    [Fact]
    public async Task Players_cannot_edit_guild_channel_members()
    {
        var context = _dataset.CreateFakeContext();
        var service = CreateService(context);
        var key = "wow:guild:44444444-4444-4444-4444-444444444444";

        var createdJson = await service.HandleAsync(GuildMessage("ENSURE_GUILD", new
        {
            ManagedKey = key,
            Title = "Orgrimmar",
            OwnerUserPublicId = OwnerPublicId,
        }));
        var created = JsonSafe.Deserialize<GuildChannelDto>(createdJson)
            ?? throw new InvalidOperationException("Channel was not created");

        var owner = await context.Users.AsNoTracking().FirstAsync(u => u.Id == 1);
        var ex = await Assert.ThrowsAsync<ForbiddenException>(() => service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Conversations",
            Action = "ADDMEMBERS",
            PublicId = created.PublicId,
            Caller = new CallerIdentity { Subject = owner.IdKeycloak.ToString("D") },
            Data = JsonSafe.Serialize(new { MemberIds = new[] { 2 } }),
        }));

        Assert.Equal("MEMBERSHIP_MANAGED", ex.Code);
    }

    [Fact]
    public async Task Removing_the_last_guild_member_keeps_the_channel()
    {
        var context = _dataset.CreateFakeContext();
        var service = CreateService(context);
        var key = "wow:guild:55555555-5555-5555-5555-555555555555";

        await service.HandleAsync(GuildMessage("ENSURE_GUILD", new
        {
            ManagedKey = key,
            Title = "Darnassus",
            OwnerUserPublicId = OwnerPublicId,
        }));

        await service.HandleAsync(GuildMessage("ADD_GUILD_MEMBER", new
        {
            ManagedKey = key,
            UserPublicId = MemberPublicId,
        }));

        await service.HandleAsync(GuildMessage("REMOVE_GUILD_MEMBER", new
        {
            ManagedKey = key,
            UserPublicId = MemberPublicId,
        }));
        await service.HandleAsync(GuildMessage("REMOVE_GUILD_MEMBER", new
        {
            ManagedKey = key,
            UserPublicId = OwnerPublicId,
        }));

        Assert.True(await context.Conversations.AnyAsync(c => c.ManagedKey == key));
        var conversationId = await context.Conversations.Where(c => c.ManagedKey == key).Select(c => c.Id).FirstAsync();
        Assert.Equal(0, await context.ConversationMembers.CountAsync(m => m.IdConversation == conversationId));
    }

    private static ConversationsService CreateService(GamersCommunityDbContext context) =>
        new(
            context,
            new NoopRealtimeEventPublisher(),
            new AesGcmMessageContentCipher(Options.Create(new MessageEncryptionSettings
            {
                Key = "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDA=",
            })),
            Options.Create(new AppSettings
            {
                AvatarSettings = new AvatarSettings
                {
                    AvatarBaseUrl = "https://avatars.test",
                    MinRangeAvatarId = 1,
                    MaxRangeAvatarId = 10,
                },
            }),
            Log.Logger);

    private static BusMessage GuildMessage(string action, object data) => new()
    {
        Type = BusServiceTypeEnum.DATA,
        Resource = "Conversations",
        Action = action,
        Data = JsonSafe.Serialize(data),
    };

    private sealed class GuildChannelDto
    {
        public Guid PublicId { get; set; }
        public string Kind { get; set; } = "";
        public string? Title { get; set; }
        public string? PictureUrl { get; set; }
        public bool MembershipLocked { get; set; }
    }
}

file sealed class NoopRealtimeEventPublisher : IRealtimeEventPublisher
{
    public Task PublishAsync<T>(T payload, CancellationToken ct = default) => Task.CompletedTask;
}
