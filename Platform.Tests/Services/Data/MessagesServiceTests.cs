using GamersCommunity.Core.Tests;
using Platform.Consumer.Realtime;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;

namespace Platform.Tests.Services.Data
{
    public class MessagesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, MessagesService, Message>, IClassFixture<FakeDataset>
    {
        protected override List<Message> GetFakeData() => [];

        protected override Message GetNewEntity() => new()
        {
            IdSender = 1,
            IdReceiver = 2,
            Content = "New message",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override MessagesService CreateService() =>
            new(CreateContext(), new NoopRealtimeEventPublisher(), Log.Logger);
    }

    file sealed class NoopRealtimeEventPublisher : IRealtimeEventPublisher
    {
        public Task PublishAsync<T>(T payload, CancellationToken ct = default) => Task.CompletedTask;
    }
}
