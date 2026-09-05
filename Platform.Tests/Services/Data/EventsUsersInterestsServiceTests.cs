using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class EventsUsersInterestsServiceTests : GenericDataServiceTests<GamersCommunityDbContext, EventsUsersInterestsService, EventsUsersInterest>, IClassFixture<FakeDataset>
    {
        protected override List<EventsUsersInterest> GetFakeData() => [];

        protected override EventsUsersInterest GetNewEntity() => new()
        {
            IdEvent = 1,
            IdStatus = 1,
            IdUser = 1,
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override EventsUsersInterestsService CreateService() => new(CreateContext());
    }
}
