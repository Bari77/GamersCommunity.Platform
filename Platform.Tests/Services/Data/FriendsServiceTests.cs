using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;

namespace Platform.Tests.Services.Data;

public class FriendsServiceTests : GenericDataServiceTests<GamersCommunityDbContext, FriendsService, Friend>, IClassFixture<FakeDataset>
{
    protected override CallerIdentity? TestCaller =>
        new() { Subject = "11111111-1111-1111-1111-111111111111" };

    protected override List<Friend> GetFakeData() => [];

    protected override Friend GetNewEntity() => new()
    {
        IdFriendAsking = 1,
        // FakeDataset already seeds 1→2; create against user 3 instead.
        IdFriendReceive = 3,
        IdFriendStatus = 1,
        CreationDate = DateTime.UtcNow,
        ModificationDate = DateTime.UtcNow,
    };

    protected override FriendsService CreateService() =>
        new(CreateContext(), new NoopRealtimeEventPublisher(), new NoopNotificationWriter(), Log.Logger);
}
