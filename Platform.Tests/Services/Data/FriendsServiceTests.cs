using GamersCommunity.Core.Tests;
using Platform.Consumer.Notifications;
using Platform.Consumer.Realtime;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;

namespace Platform.Tests.Services.Data
{
    public class FriendsServiceTests : GenericDataServiceTests<GamersCommunityDbContext, FriendsService, Friend>, IClassFixture<FakeDataset>
    {
        protected override List<Friend> GetFakeData() => [];

        protected override Friend GetNewEntity() => new()
        {
            IdFriendAsking = 1,
            IdFriendReceive = 2,
            IdFriendStatus = 1,
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override FriendsService CreateService() =>
            new(CreateContext(), new NoopRealtimeEventPublisher(), new NoopNotificationWriter(), Log.Logger);
    }

    file sealed class NoopRealtimeEventPublisher : IRealtimeEventPublisher
    {
        public Task PublishAsync<T>(T payload, CancellationToken ct = default) => Task.CompletedTask;
    }

    file sealed class NoopNotificationWriter : INotificationWriter
    {
        public Task<Notification?> CreateAsync(
            int idUser,
            string kind,
            string title,
            string? body,
            string? linkUrl,
            object? payload,
            CancellationToken ct = default) => Task.FromResult<Notification?>(null);

        public Task<Notification?> UpsertUnreadAsync(
            int idUser,
            string kind,
            string peerToken,
            string title,
            string? body,
            string? linkUrl,
            object payload,
            CancellationToken ct = default) => Task.FromResult<Notification?>(null);
    }
}
