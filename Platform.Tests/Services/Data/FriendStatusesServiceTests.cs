using GamersCommunity.Core.Tests;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data
{
    public class FriendStatusesServiceTests : GenericDataServiceTests<GamersCommunityDbContext, FriendStatusesService, FriendStatus>, IClassFixture<FakeDataset>
    {
        protected override List<FriendStatus> GetFakeData() => [];

        protected override FriendStatus GetNewEntity() => new()
        {
            Entitled = "New friend status",
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };

        protected override FriendStatusesService CreateService() => new(CreateContext());
    }
}
