using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class CountriesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, CountriesService, Country>, IClassFixture<FakeDataset>
    {
        protected override List<Country> GetFakeData() => [];

        protected override Country GetNewEntity() => new()
        {
            Name = "New country",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override CountriesService CreateService() => new(CreateContext());
    }
}
