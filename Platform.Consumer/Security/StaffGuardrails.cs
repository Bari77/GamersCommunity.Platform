using GamersCommunity.Core.Exceptions;
using Microsoft.EntityFrameworkCore;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Security;

public static class StaffGuardrails
{
    public static void EnsureNotSelf(int callerId, int targetId)
    {
        if (callerId == targetId)
            throw new ForbiddenException("SELF_TARGET", "Cannot act on yourself");
    }

    public static async Task EnsureCanSanctionAsync(
        GamersCommunityDbContext context,
        User caller,
        User target,
        CancellationToken ct)
    {
        EnsureNotSelf(caller.Id, target.Id);

        var callerRoles = await CallerAuth.LoadSiteRoleCodesAsync(context, caller.Id, ct);
        var targetRoles = await CallerAuth.LoadSiteRoleCodesAsync(context, target.Id, ct);
        var callerIsAdmin = callerRoles.Contains(SiteRoleCodes.Admin, StringComparer.OrdinalIgnoreCase);
        var targetIsAdmin = targetRoles.Contains(SiteRoleCodes.Admin, StringComparer.OrdinalIgnoreCase);

        if (targetIsAdmin && !callerIsAdmin)
            throw new ForbiddenException("FORBIDDEN", "Cannot sanction an admin");
    }

    public static async Task EnsureCanChangeSiteRoleAsync(
        GamersCommunityDbContext context,
        int targetId,
        string newCode,
        CancellationToken ct)
    {
        if (newCode is not (SiteRoleCodes.Admin or SiteRoleCodes.Moderator or SiteRoleCodes.Member))
            throw new BadRequestException("INVALID_ROLE", "Site role is invalid");

        if (newCode == SiteRoleCodes.Admin)
            return;

        var isAdmin = await context.UserSiteRoles.AnyAsync(
            r => r.IdUser == targetId && r.IdSiteRoleNavigation.Code == SiteRoleCodes.Admin,
            ct);
        if (!isAdmin)
            return;

        var adminCount = await context.UserSiteRoles.CountAsync(
            r => r.IdSiteRoleNavigation.Code == SiteRoleCodes.Admin,
            ct);
        if (adminCount <= 1)
            throw new ForbiddenException("LAST_ADMIN", "Cannot remove the last admin");
    }
}
