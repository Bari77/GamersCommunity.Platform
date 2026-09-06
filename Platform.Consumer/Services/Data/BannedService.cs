using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Models;
using Platform.Consumer.Notifications;
using Platform.Consumer.Security;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data;

public class BannedService(
    GamersCommunityDbContext context,
    INotificationWriter notificationWriter)
    : GenericDataService<GamersCommunityDbContext, Banned>(context, "Banned")
{
    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        return message.Action.ToUpperInvariant() switch
        {
            "LIST" => JsonSafe.Serialize(await ListAsync(message, ct)),
            "CREATE" => JsonSafe.Serialize(await CreateSanctionAsync(message, ct)),
            "UPDATE" => JsonSafe.Serialize(await RevokeAsync(message, ct)),
            _ => await base.HandleAsync(message, ct),
        };
    }

    private async Task<List<SanctionDto>> ListAsync(BusMessage message, CancellationToken ct)
    {
        await CallerAuth.RequireSiteRoleAsync(Context, message, SiteRoleCodes.Moderator, ct);

        Guid? targetPublicId = null;
        if (!string.IsNullOrWhiteSpace(message.Data))
        {
            var request = ConsumerParamParser.ToObject<StaffListRequest>(message.Data);
            if (Guid.TryParse(request.Query, out var parsed))
                targetPublicId = parsed;
        }

        if (message.PublicId is Guid publicId)
            targetPublicId = publicId;

        var query = Context.Banneds.AsNoTracking();
        if (targetPublicId is { } id)
        {
            var target = await Context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.PublicId == id, ct)
                ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
            query = query.Where(s => s.IdUserBan == target.Id);
        }

        var rows = await query
            .OrderByDescending(s => s.CreationDate)
            .Take(50)
            .ToListAsync(ct);

        var modoIds = rows.Select(s => s.IdModo).Distinct().ToList();
        var modos = await Context.Users.AsNoTracking()
            .Where(u => modoIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, ct);

        var now = DateTime.UtcNow;
        return rows.Select(s =>
        {
            modos.TryGetValue(s.IdModo, out var modo);
            return new SanctionDto
            {
                PublicId = s.PublicId,
                Kind = s.Kind,
                Entitled = s.Entitled,
                BeginDate = s.BeginDate,
                EndDate = s.EndDate,
                RevokedAt = s.RevokedAt,
                ModoPublicId = modo?.PublicId ?? Guid.Empty,
                ModoNickname = modo?.Nickname ?? "",
                Active = s.RevokedAt == null && s.BeginDate <= now && (s.EndDate == null || now <= s.EndDate),
            };
        }).ToList();
    }

    private async Task<SanctionDto> CreateSanctionAsync(BusMessage message, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<CreateSanctionRequest>(message.Data);
        var kind = request.Kind.Trim().ToLowerInvariant();
        if (kind is not (SanctionKinds.Mute or SanctionKinds.Ban))
            throw new BadRequestException("INVALID_KIND", "Kind must be mute or ban");

        var requiredRole = kind == SanctionKinds.Ban ? SiteRoleCodes.Admin : SiteRoleCodes.Moderator;
        var caller = await CallerAuth.RequireSiteRoleAsync(Context, message, requiredRole, ct);

        var entitled = request.Entitled?.Trim() ?? "";
        if (entitled.Length is < 3 or > 255)
            throw new BadRequestException("REASON_MANDATORY", "Reason must be between 3 and 255 characters");

        if (kind == SanctionKinds.Mute)
        {
            if (request.EndDate is not { } muteEnd || muteEnd <= DateTime.UtcNow)
                throw new BadRequestException("DURATION_MANDATORY", "Mute requires a future end date");
        }
        else if (request.EndDate is { } banEnd && banEnd <= DateTime.UtcNow)
        {
            throw new BadRequestException("INVALID_END", "Ban end date must be in the future");
        }

        var target = await Context.Users.FirstOrDefaultAsync(u => u.PublicId == request.TargetPublicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        await StaffGuardrails.EnsureCanSanctionAsync(Context, caller, target, ct);

        var now = DateTime.UtcNow;
        var entity = new Banned
        {
            PublicId = Guid.NewGuid(),
            Kind = kind,
            Entitled = entitled,
            BeginDate = now,
            EndDate = request.EndDate,
            IdUserBan = target.Id,
            IdModo = caller.Id,
            CreationDate = now,
            ModificationDate = now,
        };

        await Context.Banneds.AddAsync(entity, ct);
        await Context.SaveChangesAsync(ct);

        if (kind == SanctionKinds.Mute && entity.EndDate is { } end)
        {
            await notificationWriter.CreateAsync(
                target.Id,
                NotificationKinds.Sanction,
                NotificationMessageIds.SanctionMuteTitle,
                NotificationMessageIds.SanctionMuteBody,
                null,
                new { kind, entitled, endDate = end },
                ct);
        }

        return new SanctionDto
        {
            PublicId = entity.PublicId,
            Kind = entity.Kind,
            Entitled = entity.Entitled,
            BeginDate = entity.BeginDate,
            EndDate = entity.EndDate,
            RevokedAt = entity.RevokedAt,
            ModoPublicId = caller.PublicId,
            ModoNickname = caller.Nickname,
            Active = true,
        };
    }

    private async Task<SanctionDto> RevokeAsync(BusMessage message, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<UpdateSanctionRequest>(message.Data);
        if (!request.Revoke)
            throw new BadRequestException("NO_CHANGES", "Only revoke is supported");

        if (message.PublicId is not Guid publicId)
            throw new BadRequestException("ID_MANDATORY", "Id mandatory");

        var entity = await Context.Banneds.FirstOrDefaultAsync(s => s.PublicId == publicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        var requiredRole = entity.Kind == SanctionKinds.Ban ? SiteRoleCodes.Admin : SiteRoleCodes.Moderator;
        var caller = await CallerAuth.RequireSiteRoleAsync(Context, message, requiredRole, ct);

        var target = await Context.Users.FirstOrDefaultAsync(u => u.Id == entity.IdUserBan, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
        await StaffGuardrails.EnsureCanSanctionAsync(Context, caller, target, ct);

        entity.RevokedAt = DateTime.UtcNow;
        entity.ModificationDate = DateTime.UtcNow;
        await Context.SaveChangesAsync(ct);

        return new SanctionDto
        {
            PublicId = entity.PublicId,
            Kind = entity.Kind,
            Entitled = entity.Entitled,
            BeginDate = entity.BeginDate,
            EndDate = entity.EndDate,
            RevokedAt = entity.RevokedAt,
            ModoPublicId = caller.PublicId,
            ModoNickname = caller.Nickname,
            Active = false,
        };
    }
}
