using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class CitiesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, CitiesService, City>, IClassFixture<FakeDataset>
    {
        protected override List<City> GetFakeData() => [];

        protected override City GetNewEntity() => new()
        {
            Name = "New city",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override CitiesService CreateService() => new(CreateContext());
    }
}
