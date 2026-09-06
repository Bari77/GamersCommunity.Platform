using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Models;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data;

public class ReportsService(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher)
    : GenericDataService<GamersCommunityDbContext, Report>(context, "Reports")
{
    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        return message.Action.ToUpperInvariant() switch
        {
            "CREATE" => JsonSafe.Serialize(await CreateMineAsync(message, ct)),
            "LIST" => JsonSafe.Serialize(await ListStaffAsync(message, ct)),
            "COUNT" => JsonSafe.Serialize(await CountOpenAsync(message, ct)),
            "UPDATE" => JsonSafe.Serialize(await UpdateStaffAsync(message, ct)),
            _ => await base.HandleAsync(message, ct),
        };
    }

    private async Task<ReportDto> CreateMineAsync(BusMessage message, CancellationToken ct)
    {
        var caller = await CallerAuth.RequireUserAsync(Context, message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<CreateReportRequest>(message.Data);
        var reason = request.Reason?.Trim() ?? "";
        if (reason.Length is < 8 or > 1000)
            throw new BadRequestException("REASON_MANDATORY", "Reason must be between 8 and 1000 characters");

        var target = await Context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.PublicId == request.TargetPublicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        StaffGuardrails.EnsureNotSelf(caller.Id, target.Id);

        var now = DateTime.UtcNow;
        var entity = new Report
        {
            PublicId = Guid.NewGuid(),
            IdReporter = caller.Id,
            IdTarget = target.Id,
            Reason = reason,
            Status = ReportStatuses.Open,
            LinkUrl = string.IsNullOrWhiteSpace(request.LinkUrl) ? null : request.LinkUrl.Trim(),
            CreationDate = now,
            ModificationDate = now,
        };

        await Context.Reports.AddAsync(entity, ct);
        await Context.SaveChangesAsync(ct);
        await PublishQueueUpdatedAsync(ct);

        return new ReportDto
        {
            PublicId = entity.PublicId,
            ReporterPublicId = caller.PublicId,
            ReporterNickname = caller.Nickname,
            ReporterDiscriminator = caller.Discriminator,
            TargetPublicId = target.PublicId,
            TargetNickname = target.Nickname,
            TargetDiscriminator = target.Discriminator,
            TargetAvatarUrl = target.AvatarUrl,
            Reason = entity.Reason,
            Status = entity.Status,
            LinkUrl = entity.LinkUrl,
            CreationDate = entity.CreationDate,
        };
    }

    private async Task<List<ReportDto>> ListStaffAsync(BusMessage message, CancellationToken ct)
    {
        await CallerAuth.RequireSiteRoleAsync(Context, message, SiteRoleCodes.Moderator, ct);

        var request = string.IsNullOrWhiteSpace(message.Data)
            ? new ReportListRequest()
            : ConsumerParamParser.ToObject<ReportListRequest>(message.Data);

        var take = request.Take is > 0 and <= 50 ? request.Take : 25;
        var query = Context.Reports.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim().ToLowerInvariant();
            if (status is not (ReportStatuses.Open or ReportStatuses.Actioned or ReportStatuses.Dismissed))
                throw new BadRequestException("INVALID_STATUS", "Report status is invalid");
            query = query.Where(r => r.Status == status);
        }

        if (request.AfterPublicId is { } cursorId && request.AfterCreationDate is { } cursorDate)
        {
            query = query.Where(r =>
                r.CreationDate < cursorDate
                || (r.CreationDate == cursorDate && r.PublicId.CompareTo(cursorId) < 0));
        }

        var rows = await query
            .OrderByDescending(r => r.CreationDate)
            .ThenByDescending(r => r.PublicId)
            .Take(take)
            .ToListAsync(ct);

        var userIds = rows.SelectMany(r => new[] { r.IdReporter, r.IdTarget }).Distinct().ToList();
        var users = await Context.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, ct);

        return rows.Select(r => ToDto(r, users)).ToList();
    }

    private async Task<ReportOpenCountDto> CountOpenAsync(BusMessage message, CancellationToken ct)
    {
        await CallerAuth.RequireSiteRoleAsync(Context, message, SiteRoleCodes.Moderator, ct);
        return new ReportOpenCountDto { OpenCount = await CountOpenReportsAsync(ct) };
    }

    private async Task<ReportDto> UpdateStaffAsync(BusMessage message, CancellationToken ct)
    {
        await CallerAuth.RequireSiteRoleAsync(Context, message, SiteRoleCodes.Moderator, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");
        if (message.PublicId is not Guid publicId)
            throw new BadRequestException("ID_MANDATORY", "Id mandatory");

        var request = ConsumerParamParser.ToObject<UpdateReportRequest>(message.Data);
        var status = request.Status?.Trim().ToLowerInvariant() ?? "";
        if (status is not (ReportStatuses.Open or ReportStatuses.Actioned or ReportStatuses.Dismissed))
            throw new BadRequestException("INVALID_STATUS", "Report status is invalid");

        var entity = await Context.Reports.FirstOrDefaultAsync(r => r.PublicId == publicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        var previousStatus = entity.Status;
        entity.Status = status;
        entity.ModificationDate = DateTime.UtcNow;
        await Context.SaveChangesAsync(ct);

        if (!string.Equals(previousStatus, status, StringComparison.OrdinalIgnoreCase))
            await PublishQueueUpdatedAsync(ct);

        var users = await Context.Users.AsNoTracking()
            .Where(u => u.Id == entity.IdReporter || u.Id == entity.IdTarget)
            .ToDictionaryAsync(u => u.Id, ct);

        return ToDto(entity, users);
    }

    private async Task PublishQueueUpdatedAsync(CancellationToken ct)
    {
        var recipients = await LoadStaffKeycloakIdsAsync(ct);
        if (recipients.Length == 0)
            return;

        var openCount = await CountOpenReportsAsync(ct);
        await realtimePublisher.PublishAsync(
            new ReportQueueUpdatedRealtimeEvent
            {
                RecipientKeycloaks = recipients,
                OpenCount = openCount,
            },
            ct);
    }

    private async Task<int> CountOpenReportsAsync(CancellationToken ct) =>
        await Context.Reports.AsNoTracking().CountAsync(r => r.Status == ReportStatuses.Open, ct);

    private async Task<string[]> LoadStaffKeycloakIdsAsync(CancellationToken ct) =>
        await Context.UserSiteRoles.AsNoTracking()
            .Where(r =>
                r.IdSiteRoleNavigation.Code == SiteRoleCodes.Admin
                || r.IdSiteRoleNavigation.Code == SiteRoleCodes.Moderator)
            .Select(r => r.IdUserNavigation.IdKeycloak)
            .Distinct()
            .Select(id => id.ToString("D"))
            .ToArrayAsync(ct);

    private static ReportDto ToDto(Report report, IReadOnlyDictionary<int, User> users)
    {
        users.TryGetValue(report.IdReporter, out var reporter);
        users.TryGetValue(report.IdTarget, out var target);
        return new ReportDto
        {
            PublicId = report.PublicId,
            ReporterPublicId = reporter?.PublicId ?? Guid.Empty,
            ReporterNickname = reporter?.Nickname ?? "",
            ReporterDiscriminator = reporter?.Discriminator ?? "",
            TargetPublicId = target?.PublicId ?? Guid.Empty,
            TargetNickname = target?.Nickname ?? "",
            TargetDiscriminator = target?.Discriminator ?? "",
            TargetAvatarUrl = target?.AvatarUrl ?? "",
            Reason = report.Reason,
            Status = report.Status,
            LinkUrl = report.LinkUrl,
            CreationDate = report.CreationDate,
        };
    }
}
