using GamersCommunity.Core.Enums;
using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Platform.Consumer.Configuration;
using Platform.Consumer.Models;
using Platform.Consumer.Security;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;
using Xunit;

namespace Platform.Tests.Services.Data;

public class UsersAuthZTests : IClassFixture<FakeDataset>
{
    private readonly FakeDataset _dataset;

    public UsersAuthZTests(FakeDataset dataset) => _dataset = dataset;

    [Fact]
    public async Task Load_Signup_AssignsMemberRole()
    {
        var ctx = _dataset.CreateFakeContext();
        var service = CreateUsers(ctx);
        var keycloak = Guid.NewGuid();

        var json = await service.HandleAsync(LoadMessage(keycloak, "Nova"), CancellationToken.None);
        var session = JsonConvert.DeserializeObject<SessionUserDto>(json);

        Assert.NotNull(session);
        Assert.Contains(SiteRoleCodes.Member, session!.SiteRoles);
        Assert.True(await ctx.UserSiteRoles.AnyAsync(r => r.IdUser == session.Id && r.IdSiteRole == 3));
    }

    [Fact]
    public async Task Load_BootstrapAdmin_WhenConfiguredAndNoAdminExists()
    {
        var ctx = _dataset.CreateFakeContext();
        var keycloak = Guid.NewGuid();
        var service = CreateUsers(ctx, new AuthZSettings { BootstrapAdminKeycloakId = keycloak });

        var json = await service.HandleAsync(LoadMessage(keycloak, "AdminBoot"), CancellationToken.None);
        var session = JsonConvert.DeserializeObject<SessionUserDto>(json);

        Assert.NotNull(session);
        Assert.Contains(SiteRoleCodes.Admin, session!.SiteRoles);
    }

    [Fact]
    public async Task Load_ActiveBan_ThrowsBanned()
    {
        var ctx = _dataset.CreateFakeContext();
        var user = ctx.Users.First();
        ctx.Banneds.Add(new Banned
        {
            Kind = SanctionKinds.Ban,
            Entitled = "cheat",
            BeginDate = DateTime.UtcNow.AddMinutes(-1),
            EndDate = null,
            IdUserBan = user.Id,
            IdModo = user.Id,
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        });
        ctx.SaveChanges();

        var service = CreateUsers(ctx);
        await Assert.ThrowsAsync<BadRequestException>(() =>
            service.HandleAsync(LoadMessage(user.IdKeycloak), CancellationToken.None));
    }

    [Fact]
    public async Task StaffList_RequiresModerator()
    {
        var ctx = _dataset.CreateFakeContext();
        var member = ctx.Users.First();
        ctx.UserSiteRoles.Add(new UserSiteRole { IdUser = member.Id, IdSiteRole = 3 });
        ctx.SaveChanges();

        var service = CreateUsers(ctx);
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            service.HandleAsync(new BusMessage
            {
                Type = BusServiceTypeEnum.DATA,
                Resource = "Users",
                Action = "StaffList",
                Data = "{}",
                Caller = new CallerIdentity { Subject = member.IdKeycloak.ToString("D") },
            }, CancellationToken.None));
    }

    [Fact]
    public async Task StaffList_Moderator_ReturnsUsers()
    {
        var ctx = _dataset.CreateFakeContext();
        var modo = ctx.Users.First();
        ctx.UserSiteRoles.Add(new UserSiteRole { IdUser = modo.Id, IdSiteRole = 2 });
        ctx.SaveChanges();

        var service = CreateUsers(ctx);
        var json = await service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Users",
            Action = "StaffList",
            Data = "{}",
            Caller = new CallerIdentity { Subject = modo.IdKeycloak.ToString("D") },
        }, CancellationToken.None);

        var rows = JsonConvert.DeserializeObject<List<StaffUserDto>>(json);
        Assert.NotNull(rows);
        Assert.NotEmpty(rows!);
    }

    private static UsersService CreateUsers(GamersCommunityDbContext ctx, AuthZSettings? authZ = null) =>
        new(
            ctx,
            Options.Create(new AppSettings
            {
                AvatarSettings = new AvatarSettings
                {
                    AvatarBaseUrl = "https://example.test",
                    MinRangeAvatarId = 1,
                    MaxRangeAvatarId = 10,
                },
            }),
            Options.Create(authZ ?? new AuthZSettings()));

    private static BusMessage LoadMessage(Guid keycloak, string? nickname = null) => new()
    {
        Type = BusServiceTypeEnum.DATA,
        Resource = "Users",
        Action = "Load",
        Data = JsonConvert.SerializeObject(new { IdKeycloak = keycloak, Nickname = nickname }),
        Caller = new CallerIdentity { Subject = keycloak.ToString("D") },
    };
}
