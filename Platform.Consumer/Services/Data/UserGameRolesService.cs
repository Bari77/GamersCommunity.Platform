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

public class UserGameRolesService(GamersCommunityDbContext context) : IBusService
{
    BusServiceTypeEnum IBusService.Type => BusServiceTypeEnum.DATA;

    public string Resource => "UserGameRoles";

    public async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        if (!message.Action.Equals("Update", StringComparison.OrdinalIgnoreCase))
            throw new InternalServerErrorException("ACTION_NOT_IMPLEMENTED", $"Action {message.Action} not implemented");

        await CallerAuth.RequireSiteRoleAsync(context, message, SiteRoleCodes.Admin, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<UpdateGameRoleRequest>(message.Data);
        var target = await context.Users.FirstOrDefaultAsync(u => u.PublicId == request.TargetPublicId, ct)
            ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

        var game = await context.Games.AsNoTracking()
            .FirstOrDefaultAsync(g => g.UrlValue == request.GameUrlValue || g.UrlValue == $"/{request.GameUrlValue.TrimStart('/')}", ct)
            ?? throw new NotFoundException("GAME_NOT_FOUND", "Game not found");

        var currentForGame = await context.UserGameRoles
            .Where(r => r.IdUser == target.Id && r.IdGameRoleNavigation.IdGame == game.Id)
            .ToListAsync(ct);
        context.UserGameRoles.RemoveRange(currentForGame);

        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            var code = request.Code.Trim().ToLowerInvariant();
            if (code is not (GameRoleCodes.Admin or GameRoleCodes.Moderator or GameRoleCodes.Member))
                throw new BadRequestException("INVALID_ROLE", "Game role is invalid");

            var role = await context.GameRoles.FirstOrDefaultAsync(r => r.IdGame == game.Id && r.Code == code, ct)
                ?? throw new BadRequestException("INVALID_ROLE", "Game role is invalid");

            context.UserGameRoles.Add(new UserGameRole { IdUser = target.Id, IdGameRole = role.Id });
        }

        await context.SaveChangesAsync(ct);

        var gameRoles = await context.UserGameRoles.AsNoTracking()
            .Where(r => r.IdUser == target.Id)
            .Select(r => new GameRoleAssignmentDto
            {
                GameUrlValue = r.IdGameRoleNavigation.IdGameNavigation.UrlValue,
                Code = r.IdGameRoleNavigation.Code,
            })
            .ToListAsync(ct);

        return JsonSafe.Serialize(new StaffUserDto
        {
            Id = target.Id,
            PublicId = target.PublicId,
            Nickname = target.Nickname,
            Discriminator = target.Discriminator,
            AvatarUrl = target.AvatarUrl,
            LastConnection = target.LastConnection,
            GameRoles = gameRoles,
            Sanction = SanctionFilters.None,
        });
    }
}
