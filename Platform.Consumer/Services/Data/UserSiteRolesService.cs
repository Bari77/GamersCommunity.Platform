using GamersCommunity.Core.Enums;
using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Models;
using Platform.Consumer.Security;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data;

public class UserSiteRolesService(GamersCommunityDbContext context) : IBusService
{
    BusServiceTypeEnum IBusService.Type => BusServiceTypeEnum.DATA;

    public string Resource => "UserSiteRoles";

    public async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        if (!message.Action.Equals("Update", StringComparison.OrdinalIgnoreCase))
            throw new InternalServerErrorException("ACTION_NOT_IMPLEMENTED", $"Action {message.Action} not implemented");

        var caller = await CallerAuth.RequireSiteRoleAsync(context, message, SiteRoleCodes.Admin, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<UpdateSiteRoleRequest>(message.Data);
        var code = request.Code?.Trim().ToLowerInvariant() ?? "";
        var target = await context.Users.FirstOrDefaultAsync(u => u.PublicId == request.TargetPublicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        await StaffGuardrails.EnsureCanChangeSiteRoleAsync(context, target.Id, code, ct);

        var role = await context.SiteRoles.FirstOrDefaultAsync(r => r.Code == code, ct)
            ?? throw new BadRequestException("INVALID_ROLE", "Site role is invalid");

        var existing = await context.UserSiteRoles.Where(r => r.IdUser == target.Id).ToListAsync(ct);
        context.UserSiteRoles.RemoveRange(existing);
        context.UserSiteRoles.Add(new UserSiteRole { IdUser = target.Id, IdSiteRole = role.Id });
        await context.SaveChangesAsync(ct);

        return JsonSafe.Serialize(new StaffUserDto
        {
            Id = target.Id,
            PublicId = target.PublicId,
            Nickname = target.Nickname,
            Discriminator = target.Discriminator,
            AvatarUrl = target.AvatarUrl,
            LastConnection = target.LastConnection,
            SiteRoles = [code],
            Sanction = SanctionFilters.None,
        });
    }
}
