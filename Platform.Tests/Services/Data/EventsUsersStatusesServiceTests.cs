using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class EventsUsersStatusesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, EventsUsersStatusesService, EventsUsersStatus>, IClassFixture<FakeDataset>
    {
        protected override List<EventsUsersStatus> GetFakeData() => [];

        protected override EventsUsersStatus GetNewEntity() => new()
        {
            Entitled = "New status",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override EventsUsersStatusesService CreateService() => new(CreateContext());
    }
}
