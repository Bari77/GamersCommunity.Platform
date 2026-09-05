using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

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

        protected override MessagesService CreateService() => new(CreateContext());
    }
}
