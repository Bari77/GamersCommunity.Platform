using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class EventsServiceTests : GenericDataServiceTests<GamersCommunityDbContext, EventsService, Event>, IClassFixture<FakeDataset>
    {
        protected override List<Event> GetFakeData() => [];

        protected override Event GetNewEntity() => new()
        {
            Title = "New event",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
            Active = false,
            BeginDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(7),
            Description = string.Empty,
            Address = null,
            NumAddress = null,
            Image = null,
            Link = null,
            PlaceName = null,
            Places = null,
        };

        protected override EventsService CreateService() => new(CreateContext());
    }
}
