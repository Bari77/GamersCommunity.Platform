using GamersCommunity.Core.Enums;
using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Platform.Consumer.Configuration;
using Platform.Consumer.Models;
using Platform.Consumer.Notifications;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Consumer.Services.Data;
using Platform.Database.Context;
using Platform.Database.Models;
using Xunit;

namespace Platform.Tests.Services.Data;

public class SanctionsAndRolesTests : IClassFixture<FakeDataset>
{
    private readonly FakeDataset _dataset;

    public SanctionsAndRolesTests(FakeDataset dataset) => _dataset = dataset;

    [Fact]
    public async Task Mute_Moderator_CreatesSanction()
    {
        var ctx = _dataset.CreateFakeContext();
        var modo = ctx.Users.First(u => u.Id == 1);
        var target = ctx.Users.First(u => u.Id == 2);
        ctx.UserSiteRoles.Add(new UserSiteRole { IdUser = modo.Id, IdSiteRole = 2 });
        ctx.SaveChanges();

        var service = new BannedService(ctx, new NoopNotificationWriter());
        var json = await service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Banned",
            Action = "Create",
            Data = JsonConvert.SerializeObject(new CreateSanctionRequest
            {
                TargetPublicId = target.PublicId,
                Kind = SanctionKinds.Mute,
                Entitled = "spam in chat",
                EndDate = DateTime.UtcNow.AddHours(2),
            }),
            Caller = new CallerIdentity { Subject = modo.IdKeycloak.ToString("D") },
        }, CancellationToken.None);

        var dto = JsonConvert.DeserializeObject<SanctionDto>(json);
        Assert.Equal(SanctionKinds.Mute, dto!.Kind);
        Assert.True(dto.Active);
    }

    [Fact]
    public async Task Ban_Moderator_IsForbidden()
    {
        var ctx = _dataset.CreateFakeContext();
        var modo = ctx.Users.First(u => u.Id == 1);
        var target = ctx.Users.First(u => u.Id == 2);
        ctx.UserSiteRoles.Add(new UserSiteRole { IdUser = modo.Id, IdSiteRole = 2 });
        ctx.SaveChanges();

        var service = new BannedService(ctx, new NoopNotificationWriter());
        await Assert.ThrowsAsync<ForbiddenException>(() => service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Banned",
            Action = "Create",
            Data = JsonConvert.SerializeObject(new CreateSanctionRequest
            {
                TargetPublicId = target.PublicId,
                Kind = SanctionKinds.Ban,
                Entitled = "cheat",
            }),
            Caller = new CallerIdentity { Subject = modo.IdKeycloak.ToString("D") },
        }, CancellationToken.None));
    }

    [Fact]
    public async Task SiteRole_CannotRemoveLastAdmin()
    {
        var ctx = _dataset.CreateFakeContext();
        var admin = ctx.Users.First(u => u.Id == 1);
        var other = ctx.Users.First(u => u.Id == 2);
        ctx.UserSiteRoles.AddRange(
            new UserSiteRole { IdUser = admin.Id, IdSiteRole = 1 },
            new UserSiteRole { IdUser = other.Id, IdSiteRole = 3 });
        ctx.SaveChanges();

        var service = new UserSiteRolesService(ctx);
        await Assert.ThrowsAsync<ForbiddenException>(() => service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "UserSiteRoles",
            Action = "Update",
            Data = JsonConvert.SerializeObject(new UpdateSiteRoleRequest
            {
                TargetPublicId = admin.PublicId,
                Code = SiteRoleCodes.Member,
            }),
            Caller = new CallerIdentity { Subject = admin.IdKeycloak.ToString("D") },
        }, CancellationToken.None));
    }

    [Fact]
    public async Task Report_Create_ThenStaffUpdate()
    {
        var ctx = _dataset.CreateFakeContext();
        var reporter = ctx.Users.First(u => u.Id == 1);
        var target = ctx.Users.First(u => u.Id == 2);
        ctx.UserSiteRoles.Add(new UserSiteRole { IdUser = reporter.Id, IdSiteRole = 2 });
        ctx.SaveChanges();

        var service = new ReportsService(ctx);
        var createdJson = await service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Reports",
            Action = "Create",
            Data = JsonConvert.SerializeObject(new CreateReportRequest
            {
                TargetPublicId = target.PublicId,
                Reason = "Harassment on profile",
                LinkUrl = "/users/" + target.PublicId,
            }),
            Caller = new CallerIdentity { Subject = reporter.IdKeycloak.ToString("D") },
        }, CancellationToken.None);

        var created = JsonConvert.DeserializeObject<ReportDto>(createdJson);
        Assert.Equal(ReportStatuses.Open, created!.Status);

        var updatedJson = await service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Reports",
            Action = "Update",
            PublicId = created.PublicId,
            Data = JsonConvert.SerializeObject(new UpdateReportRequest { Status = ReportStatuses.Dismissed }),
            Caller = new CallerIdentity { Subject = reporter.IdKeycloak.ToString("D") },
        }, CancellationToken.None);

        var updated = JsonConvert.DeserializeObject<ReportDto>(updatedJson);
        Assert.Equal(ReportStatuses.Dismissed, updated!.Status);
    }

    [Fact]
    public async Task FriendsCreate_BannedUser_Throws()
    {
        var ctx = _dataset.CreateFakeContext();
        var banned = ctx.Users.First(u => u.Id == 1);
        ctx.Banneds.Add(new Banned
        {
            Kind = SanctionKinds.Ban,
            Entitled = "ban",
            BeginDate = DateTime.UtcNow.AddMinutes(-5),
            IdUserBan = banned.Id,
            IdModo = banned.Id,
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        });
        ctx.SaveChanges();

        var service = new FriendsService(ctx, new NoopRealtime(), new NoopNotificationWriter(), Serilog.Log.Logger);
        await Assert.ThrowsAsync<BadRequestException>(() => service.HandleAsync(new BusMessage
        {
            Type = BusServiceTypeEnum.DATA,
            Resource = "Friends",
            Action = "Create",
            Data = JsonConvert.SerializeObject(new Friend { IdFriendReceive = 2 }),
            Caller = new CallerIdentity { Subject = banned.IdKeycloak.ToString("D") },
        }, CancellationToken.None));
    }
}

file sealed class NoopRealtime : IRealtimeEventPublisher
{
    public Task PublishAsync<T>(T payload, CancellationToken ct = default) => Task.CompletedTask;
}

file sealed class NoopNotificationWriter : INotificationWriter
{
    public Task<Notification?> CreateAsync(
        int idUser,
        string kind,
        string title,
        string? body,
        string? linkUrl,
        object? payload,
        CancellationToken ct = default) => Task.FromResult<Notification?>(null);

    public Task<Notification?> UpsertUnreadAsync(
        int idUser,
        string kind,
        string peerToken,
        string title,
        string? body,
        string? linkUrl,
        object payload,
        CancellationToken ct = default) => Task.FromResult<Notification?>(null);
}
