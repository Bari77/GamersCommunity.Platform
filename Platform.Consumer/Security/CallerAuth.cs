using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using Microsoft.EntityFrameworkCore;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Security;

public static class CallerAuth
{
    public static async Task<User> RequireUserAsync(
        GamersCommunityDbContext context,
        BusMessage message,
        CancellationToken ct)
    {
        if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");

        return await context.Users.FirstOrDefaultAsync(u => u.IdKeycloak == idKeycloak, ct)
            ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
    }

    public static async Task<User> RequireSiteRoleAsync(
        GamersCommunityDbContext context,
        BusMessage message,
        string role,
        CancellationToken ct)
    {
        var user = await RequireUserAsync(context, message, ct);
        var codes = await LoadSiteRoleCodesAsync(context, user.Id, ct);
        if (!SatisfiesSiteRole(codes, role))
            throw new ForbiddenException("FORBIDDEN", "Insufficient site role");

        return user;
    }

    public static bool SatisfiesSiteRole(IReadOnlyCollection<string> codes, string required)
    {
        if (codes.Contains(SiteRoleCodes.Admin, StringComparer.OrdinalIgnoreCase))
            return true;

        return required.Equals(SiteRoleCodes.Moderator, StringComparison.OrdinalIgnoreCase)
            && codes.Contains(SiteRoleCodes.Moderator, StringComparer.OrdinalIgnoreCase);
    }

    public static async Task<List<string>> LoadSiteRoleCodesAsync(
        GamersCommunityDbContext context,
        int userId,
        CancellationToken ct) =>
        await context.UserSiteRoles.AsNoTracking()
            .Where(r => r.IdUser == userId)
            .Select(r => r.IdSiteRoleNavigation.Code)
            .ToListAsync(ct);

    public static async Task EnsureNotBannedAsync(
        GamersCommunityDbContext context,
        int userId,
        CancellationToken ct)
    {
        if (await HasActiveBanAsync(context, userId, ct))
            throw new BadRequestException("BANNED", "Banned account");
    }

    public static Task<bool> HasActiveBanAsync(
        GamersCommunityDbContext context,
        int userId,
        CancellationToken ct) =>
        ActiveSanctions(context, userId, SanctionKinds.Ban).AnyAsync(ct);

    public static Task<Banned?> ActiveMuteAsync(
        GamersCommunityDbContext context,
        int userId,
        CancellationToken ct) =>
        ActiveSanctions(context, userId, SanctionKinds.Mute)
            .OrderByDescending(s => s.EndDate)
            .FirstOrDefaultAsync(ct);

    public static IQueryable<Banned> ActiveSanctions(
        GamersCommunityDbContext context,
        int userId,
        string? kind = null)
    {
        var now = DateTime.UtcNow;
        var query = context.Banneds.AsNoTracking()
            .Where(s =>
                s.IdUserBan == userId
                && s.RevokedAt == null
                && s.BeginDate <= now
                && (s.EndDate == null || now <= s.EndDate));

        if (!string.IsNullOrEmpty(kind))
            query = query.Where(s => s.Kind == kind);

        return query;
    }

    public static string ActiveSanctionLabel(IEnumerable<Banned> sanctions)
    {
        var now = DateTime.UtcNow;
        var active = sanctions
            .Where(s => s.RevokedAt == null && s.BeginDate <= now && (s.EndDate == null || now <= s.EndDate))
            .ToList();

        if (active.Any(s => s.Kind == SanctionKinds.Ban))
            return SanctionFilters.Banned;
        if (active.Any(s => s.Kind == SanctionKinds.Mute))
            return SanctionFilters.Muted;
        return SanctionFilters.None;
    }
}
