using GamersCommunity.Core.Tests;
using Platform.Consumer.Utils;
using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Tests
{
    public class FakeDataset : IFakeDataset<GamersCommunityDbContext>
    {
        /// <summary>
        /// Creates a new in-memory <see cref="GamersCommunityDbContext"/> with a unique database name and fill with basic fake data.
        /// </summary>
        public GamersCommunityDbContext CreateFakeContext() => SeedFakeData(new GamersCommunityDbContext(
            new DbContextOptionsBuilder<GamersCommunityDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options
            ));

        /// <summary>
        /// Seeds the full test dataset required across all services (relations, dependencies, etc.).
        /// </summary>
        private GamersCommunityDbContext SeedFakeData(GamersCommunityDbContext ctx)
        {
            ctx.ChangeTracker.AutoDetectChangesEnabled = false;

            #region GameTypes

            ctx.GameTypes.AddRange(
                new GameType
                {
                    Id = 1,
                    Entitled = "Game type A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new GameType
                {
                    Id = 2,
                    Entitled = "Game type B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                }
            );

            #endregion

            #region Games

            ctx.Games.AddRange(
                new Game
                {
                    Id = 1,
                    Title = "Game A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    IdType = 1,
                    Picture = string.Empty,
                    UrlValue = string.Empty,
                },
                new Game
                {
                    Id = 2,
                    Title = "Game B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    IdType = 2,
                    Picture = string.Empty,
                    UrlValue = string.Empty,
                }
            );

            #endregion

            #region Countries

            ctx.Countries.AddRange(
                new Country
                {
                    Id = 1,
                    Name = "Country A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow
                },
                new Country
                {
                    Id = 2,
                    Name = "Country B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow
                }
            );

            #endregion

            #region Cities

            ctx.Cities.AddRange(
                new City
                {
                    Id = 1,
                    Name = "City A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    IdCountry = 1,
                },
                new City
                {
                    Id = 2,
                    Name = "City B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    IdCountry = 2,
                }
            );

            #endregion

            #region Users

            ctx.Users.AddRange(
                new User
                {
                    Id = 1,
                    Nickname = "User A",
                    Discriminator = DiscriminatorHelper.GetRandomDiscriminator(),
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    AvatarUrl = string.Empty,
                    Mail = string.Empty,
                    IdKeycloak = Guid.NewGuid(),
                    LastConnection = DateTime.UtcNow,
                },
                new User
                {
                    Id = 2,
                    Nickname = "User B",
                    Discriminator = DiscriminatorHelper.GetRandomDiscriminator(),
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    AvatarUrl = string.Empty,
                    Mail = string.Empty,
                    IdKeycloak = Guid.NewGuid(),
                    LastConnection = DateTime.UtcNow,
                },
                new User
                {
                    Id = 3,
                    Nickname = "User C",
                    Discriminator = DiscriminatorHelper.GetRandomDiscriminator(),
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    AvatarUrl = string.Empty,
                    Mail = string.Empty,
                    IdKeycloak = Guid.NewGuid(),
                    LastConnection = DateTime.UtcNow,
                }
            );

            #endregion

            #region Events

            ctx.Events.AddRange(
                new Event
                {
                    Id = 1,
                    Title = "Event A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    Active = false,
                    BeginDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(7),
                    Description = string.Empty,
                    Address = null,
                    NumAddress = null,
                    IdCity = 1,
                    Image = null,
                    Link = null,
                    PlaceName = null,
                    Places = null,
                },
                new Event
                {
                    Id = 2,
                    Title = "Event B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                    Active = false,
                    BeginDate = DateTime.UtcNow,
                    EndDate = DateTime.UtcNow.AddDays(7),
                    Description = string.Empty,
                    Address = null,
                    NumAddress = null,
                    IdCity = 2,
                    Image = null,
                    Link = null,
                    PlaceName = null,
                    Places = null,
                }
            );

            #endregion

            #region EventsUsersStatuses

            ctx.EventsUsersStatuses.AddRange(
                new EventsUsersStatus
                {
                    Id = 1,
                    Entitled = "Status A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new EventsUsersStatus
                {
                    Id = 2,
                    Entitled = "Status B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new EventsUsersStatus
                {
                    Id = 3,
                    Entitled = "Status C",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                }
            );

            #endregion

            #region EventsUsersInterests

            ctx.EventsUsersInterests.AddRange(
                new EventsUsersInterest
                {
                    Id = 1,
                    IdEvent = 1,
                    IdUser = 1,
                    IdStatus = 1,
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new EventsUsersInterest
                {
                    Id = 2,
                    IdEvent = 1,
                    IdUser = 2,
                    IdStatus = 2,
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                }
            );

            #endregion

            #region FriendStatuses

            ctx.FriendStatuses.AddRange(
                new FriendStatus
                {
                    Id = 1,
                    Entitled = "Friend status A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new FriendStatus
                {
                    Id = 2,
                    Entitled = "Friend status B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new FriendStatus
                {
                    Id = 3,
                    Entitled = "Friend status C",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                }
            );

            #endregion

            #region Friends

            ctx.Friends.AddRange(
                new Friend
                {
                    Id = 1,
                    IdFriendAsking = 1,
                    IdFriendReceive = 2,
                    IdFriendStatus = 1,
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new Friend
                {
                    Id = 2,
                    IdFriendAsking = 2,
                    IdFriendReceive = 3,
                    IdFriendStatus = 2,
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                }
            );

            #endregion

            #region Messages

            ctx.Messages.AddRange(
                new Message
                {
                    PublicId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    IdSender = 1,
                    IdReceiver = 2,
                    Content = "Content A",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                },
                new Message
                {
                    PublicId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    IdSender = 2,
                    IdReceiver = 3,
                    Content = "Content B",
                    CreationDate = DateTime.UtcNow,
                    ModificationDate = DateTime.UtcNow,
                }
            );

            #endregion

            ctx.ChangeTracker.AutoDetectChangesEnabled = true;

            ctx.SaveChanges();

            return ctx;
        }
    }
}
