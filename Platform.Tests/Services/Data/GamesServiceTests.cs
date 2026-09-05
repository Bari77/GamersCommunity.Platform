using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class GamesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, GamesService, Game>, IClassFixture<FakeDataset>
    {
        protected override List<Game> GetFakeData() => [];

        protected override Game GetNewEntity() => new()
        {
            Title = "New game",
            IdType = 1,
            Picture = string.Empty,
            UrlValue = string.Empty,
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override GamesService CreateService() => new(CreateContext());
    }
}
