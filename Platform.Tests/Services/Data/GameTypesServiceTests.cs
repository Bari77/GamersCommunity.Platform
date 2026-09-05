using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class GameTypesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, GameTypesService, GameType>, IClassFixture<FakeDataset>
    {
        protected override List<GameType> GetFakeData() => [];

        protected override GameType GetNewEntity() => new()
        {
            Entitled = "New game type",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override GameTypesService CreateService() => new(CreateContext());
    }
}
