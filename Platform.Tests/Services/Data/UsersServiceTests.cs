using GamersCommunity.Core.Tests;
using Platform.Consumer.Configuration;
using Platform.Consumer.Services.Data;
using Platform.Consumer.Utils;
using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.Extensions.Options;

namespace Platform.Tests.Services.Data
{
    public class UsersServiceTests : GenericDataServiceTests<GamersCommunityDbContext, UsersService, User>, IClassFixture<FakeDataset>
    {
        protected override List<User> GetFakeData() => [];

        protected override User GetNewEntity() => new()
        {
            Nickname = "New user",
            Discriminator = DiscriminatorHelper.GetRandomDiscriminator(),
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
            AvatarUrl = string.Empty,
            IdKeycloak = Guid.NewGuid(),
            LastConnection = DateTime.UtcNow,
            Mail = string.Empty,
        };

        protected override UsersService CreateService() => new(
            CreateContext(),
            Options.Create(new AppSettings
            {
                AvatarSettings = new AvatarSettings
                {
                    AvatarBaseUrl = string.Empty,
                    MinRangeAvatarId = 1,
                    MaxRangeAvatarId = 10,
                }
            }),
            Options.Create(new AuthZSettings()));
    }
}
