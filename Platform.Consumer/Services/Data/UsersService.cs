using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Platform.Consumer.Configuration;
using Platform.Consumer.Models;
using Platform.Consumer.Security;
using Platform.Consumer.Utils;
using Platform.Consumer.Validators;
using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Platform.Consumer.Services.Data
{
    /// <summary>
    /// Specialized table service for handling <see cref="User"/> entities.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This service inherits from <see cref="GenericDataService{TContext, TEntity}"/>,
    /// binding it to the <see cref="GamersCommunityDbContext"/> database context and the <see cref="User"/> entity type.
    /// </para>
    /// <para>
    /// It exposes all generic CRUD operations (List, Get, Update, Delete, etc.) implemented
    /// in <see cref="GenericDataService{TContext, TEntity}"/>, while associating them with the logical table name <c>"Users"</c>.
    /// </para>
    /// </remarks>
    /// <param name="context">
    /// The database context used to access the <c>Users</c> table.
    /// Typically injected by dependency injection.
    /// </param>
    public class UsersService(
        GamersCommunityDbContext context,
        IOptions<AppSettings> otps,
        IOptions<AuthZSettings> authZOptions) : GenericDataService<GamersCommunityDbContext, User>(context, "Users")
    {
        /// <summary>
        /// Random number generator
        /// </summary>
        private static readonly Random Random = new();

        /// <summary>
        /// App settings options value
        /// </summary>
        private readonly AppSettings AppSettings = otps.Value;
        private readonly AuthZSettings AuthZ = authZOptions.Value;

        public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
        {
            switch (message.Action)
            {
                case "Load":
                    if (string.IsNullOrEmpty(message.Data))
                    {
                        throw new BadRequestException("MANDATORY", "Data mandatory");
                    }

                    var info = ConsumerParamParser.ToObject<LoadRequest>(message.Data);
                    var idKeycloak = message.Caller?.Subject is { } subject
                        && Guid.TryParse(subject, out var fromCaller)
                        ? fromCaller
                        : info.IdKeycloak;
                    var user = await Context.Users.FirstOrDefaultAsync(f => f.IdKeycloak == idKeycloak, ct);

                    if (user != null)
                    {
                        await CallerAuth.EnsureNotBannedAsync(Context, user.Id, ct);
                        return JsonSafe.Serialize(await ToSessionAsync(await LoginAsync(user, ct), ct));
                    }

                    if (string.IsNullOrEmpty(info.Nickname))
                    {
                        throw new BadRequestException("NICKNAME_MANDATORY", "Nickname mandatory");
                    }

                    user = new()
                    {
                        IdKeycloak = idKeycloak,
                        Mail = info.Mail,
                        Nickname = info.Nickname,
                    };
                    return JsonSafe.Serialize(await SignupAsync(user, ct));

                case "Update":
                    return JsonSafe.Serialize(await UpdateUserAsync(message, ct));

                case "Search":
                    return JsonSafe.Serialize(await SearchPublicAsync(message, ct));

                case "Get":
                    return JsonSafe.Serialize(await GetPublicAsync(message, ct));

                case "Touch":
                    return JsonSafe.Serialize(await TouchPresenceAsync(message, ct));

                case "StaffList":
                    return JsonSafe.Serialize(await StaffListAsync(message, ct));

                case "StaffGet":
                    return JsonSafe.Serialize(await StaffGetAsync(message, ct));
            }

            return await base.HandleAsync(message, ct);
        }

        private async Task<SessionUserDto> TouchPresenceAsync(BusMessage message, CancellationToken ct)
        {
            var user = await CallerAuth.RequireUserAsync(Context, message, ct);
            await CallerAuth.EnsureNotBannedAsync(Context, user.Id, ct);
            return await ToSessionAsync(await LoginAsync(user, ct), ct);
        }

        private async Task<List<StaffUserDto>> StaffListAsync(BusMessage message, CancellationToken ct)
        {
            await CallerAuth.RequireSiteRoleAsync(Context, message, SiteRoleCodes.Moderator, ct);

            var request = string.IsNullOrWhiteSpace(message.Data)
                ? new StaffListRequest()
                : ConsumerParamParser.ToObject<StaffListRequest>(message.Data);

            var take = request.Take is > 0 and <= 50 ? request.Take : 25;
            var users = Context.Users.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(request.Query))
            {
                var query = request.Query.Trim();
                if (query.Length > 64)
                    throw new BadRequestException("QUERY_TOO_LONG", "Search query is too long");

                var hashIndex = query.IndexOf('#');
                if (hashIndex >= 0)
                {
                    var nickname = query[..hashIndex].Trim();
                    var discriminator = query[(hashIndex + 1)..].Trim();
                    if (nickname.Length > 0)
                        users = users.Where(u => u.Nickname.StartsWith(nickname));
                    if (discriminator.Length > 0)
                        users = users.Where(u => u.Discriminator.StartsWith(discriminator));
                }
                else
                {
                    users = users.Where(u => u.Nickname.Contains(query));
                }
            }

            if (!string.IsNullOrWhiteSpace(request.SiteRole))
            {
                var role = request.SiteRole.Trim();
                users = users.Where(u => u.UserSiteRoles.Any(r => r.IdSiteRoleNavigation.Code == role));
            }

            if (request.LastConnectionAfter is { } after)
                users = users.Where(u => u.LastConnection != null && u.LastConnection >= after);
            if (request.LastConnectionBefore is { } before)
                users = users.Where(u => u.LastConnection != null && u.LastConnection <= before);

            if (request.AfterPublicId is { } cursorId && request.AfterLastConnection is { } cursorDate)
            {
                users = users.Where(u =>
                    u.LastConnection < cursorDate
                    || (u.LastConnection == cursorDate && u.PublicId.CompareTo(cursorId) < 0)
                    || (u.LastConnection == null && cursorDate != DateTime.MinValue));
            }

            var now = DateTime.UtcNow;
            if (request.Sanction is { } sanction && sanction.Length > 0)
            {
                users = sanction switch
                {
                    SanctionFilters.Banned => users.Where(u => u.BannedIdUserBanNavigations.Any(s =>
                        s.Kind == SanctionKinds.Ban && s.RevokedAt == null && s.BeginDate <= now
                        && (s.EndDate == null || now <= s.EndDate))),
                    SanctionFilters.Muted => users.Where(u =>
                        !u.BannedIdUserBanNavigations.Any(s =>
                            s.Kind == SanctionKinds.Ban && s.RevokedAt == null && s.BeginDate <= now
                            && (s.EndDate == null || now <= s.EndDate))
                        && u.BannedIdUserBanNavigations.Any(s =>
                            s.Kind == SanctionKinds.Mute && s.RevokedAt == null && s.BeginDate <= now
                            && (s.EndDate == null || now <= s.EndDate))),
                    SanctionFilters.None => users.Where(u => !u.BannedIdUserBanNavigations.Any(s =>
                        s.RevokedAt == null && s.BeginDate <= now && (s.EndDate == null || now <= s.EndDate))),
                    _ => throw new BadRequestException("INVALID_SANCTION", "Sanction filter is invalid"),
                };
            }

            var rows = await users
                .Include(u => u.UserSiteRoles).ThenInclude(r => r.IdSiteRoleNavigation)
                .Include(u => u.UserGameRoles).ThenInclude(r => r.IdGameRoleNavigation).ThenInclude(r => r.IdGameNavigation)
                .Include(u => u.BannedIdUserBanNavigations)
                .OrderByDescending(u => u.LastConnection)
                .ThenByDescending(u => u.PublicId)
                .Take(take)
                .ToListAsync(ct);

            return rows.Select(ToStaffUser).ToList();
        }

        private async Task<StaffUserDetailDto> StaffGetAsync(BusMessage message, CancellationToken ct)
        {
            await CallerAuth.RequireSiteRoleAsync(Context, message, SiteRoleCodes.Moderator, ct);

            if (message.PublicId is not Guid publicId)
                throw new BadRequestException("ID_MANDATORY", "Id mandatory");

            var user = await Context.Users.AsNoTracking()
                .Include(u => u.UserSiteRoles).ThenInclude(r => r.IdSiteRoleNavigation)
                .Include(u => u.UserGameRoles).ThenInclude(r => r.IdGameRoleNavigation).ThenInclude(r => r.IdGameNavigation)
                .Include(u => u.BannedIdUserBanNavigations)
                .FirstOrDefaultAsync(u => u.PublicId == publicId, ct)
                ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

            var modoIds = user.BannedIdUserBanNavigations.Select(s => s.IdModo).Distinct().ToList();
            var modos = await Context.Users.AsNoTracking()
                .Where(u => modoIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, ct);

            var now = DateTime.UtcNow;
            var sanctions = user.BannedIdUserBanNavigations
                .OrderByDescending(s => s.CreationDate)
                .Select(s =>
                {
                    modos.TryGetValue(s.IdModo, out var modo);
                    var active = s.RevokedAt == null && s.BeginDate <= now && (s.EndDate == null || now <= s.EndDate);
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
                        Active = active,
                    };
                })
                .ToList();

            var summary = ToStaffUser(user);
            return new StaffUserDetailDto
            {
                Id = summary.Id,
                PublicId = summary.PublicId,
                Nickname = summary.Nickname,
                Discriminator = summary.Discriminator,
                AvatarUrl = summary.AvatarUrl,
                LastConnection = summary.LastConnection,
                SiteRoles = summary.SiteRoles,
                GameRoles = summary.GameRoles,
                Sanction = summary.Sanction,
                Sanctions = sanctions,
            };
        }

        private async Task<List<PublicUserProfile>> SearchPublicAsync(BusMessage message, CancellationToken ct)
        {
            var query = string.Empty;
            if (!string.IsNullOrWhiteSpace(message.Data))
            {
                var request = ConsumerParamParser.ToObject<UserSearchRequest>(message.Data);
                query = (request.Query ?? string.Empty).Trim();
            }

            if (query.Length < 1)
            {
                throw new BadRequestException("QUERY_MANDATORY", "Search query mandatory");
            }

            if (query.Length > 64)
            {
                throw new BadRequestException("QUERY_TOO_LONG", "Search query is too long");
            }

            var hashIndex = query.IndexOf('#');
            IQueryable<User> users = Context.Users.AsNoTracking();

            if (hashIndex >= 0)
            {
                var nickname = query[..hashIndex].Trim();
                var discriminator = query[(hashIndex + 1)..].Trim();

                if (nickname.Length == 0 && discriminator.Length == 0)
                {
                    throw new BadRequestException("QUERY_MANDATORY", "Search query mandatory");
                }

                if (nickname.Length > 0)
                {
                    users = users.Where(u => u.Nickname.StartsWith(nickname));
                }

                if (discriminator.Length > 0)
                {
                    users = users.Where(u => u.Discriminator.StartsWith(discriminator));
                }
            }
            else
            {
                users = users.Where(u => u.Nickname.Contains(query));
            }

            var rows = await users
                .OrderBy(u => u.Nickname)
                .ThenBy(u => u.Discriminator)
                .Take(25)
                .ToListAsync(ct);

            return rows.Select(PublicUserProfile.FromEntity).ToList();
        }

        private async Task<PublicUserProfile> GetPublicAsync(BusMessage message, CancellationToken ct)
        {
            var entity = await ResolveAsync(message, ct);
            return PublicUserProfile.FromEntity(entity);
        }

        private async Task<User> UpdateUserAsync(BusMessage message, CancellationToken ct)
        {
            if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            {
                throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");
            }

            if (string.IsNullOrEmpty(message.Data))
            {
                throw new BadRequestException("MANDATORY", "Data mandatory");
            }

            if (message.PublicId is not Guid publicId)
            {
                throw new BadRequestException("ID_MANDATORY", "Id mandatory");
            }

            var request = ConsumerParamParser.ToObject<UpdateUserRequest>(message.Data);
            if (request.AvatarId is null && request.Nickname is null)
            {
                throw new BadRequestException("NO_CHANGES", "At least one updatable field is required");
            }

            // Load tracked: consumer DbContext is long-lived; avoid Context.Update on a second instance.
            var user = await Context.Users.FirstOrDefaultAsync(u => u.PublicId == publicId, ct)
                ?? throw new NotFoundException("NOT_FOUND", "Cannot find ressource");

            if (user.IdKeycloak != idKeycloak)
            {
                throw new ForbiddenException("FORBIDDEN", "Cannot update another user");
            }

            if (request.AvatarId is int avatarId)
            {
                var min = AppSettings.AvatarSettings.MinRangeAvatarId;
                var max = AppSettings.AvatarSettings.MaxRangeAvatarId;
                if (avatarId < min || avatarId > max)
                {
                    throw new BadRequestException("INVALID_AVATAR", $"Avatar id must be between {min} and {max}");
                }

                user.AvatarUrl = BuildAvatarUrl(avatarId);
            }

            if (request.Nickname is not null)
            {
                UserValidator.ValidateNickname(request.Nickname);
                if (!string.Equals(user.Nickname, request.Nickname, StringComparison.Ordinal))
                {
                    var nicknameTaken = await Context.Users.AnyAsync(
                        u => u.Id != user.Id && u.Nickname == request.Nickname && u.Discriminator == user.Discriminator,
                        ct);
                    if (nicknameTaken)
                    {
                        throw new BadRequestException("NICKNAME_TAKEN", "Nickname already taken with this discriminator");
                    }

                    user.Nickname = request.Nickname;
                }
            }

            user.ModificationDate = DateTime.UtcNow;
            await Context.SaveChangesAsync(ct);
            return user;
        }

        /// <summary>
        /// Creates a new user account in the database if no existing account matches the provided nickname and discriminator.
        /// This method generates a unique discriminator (4-digit numeric code) and a random avatar before saving the user.
        /// Once created, the user is automatically logged in via <see cref="LoginAsync(User, CancellationToken)"/>.
        /// </summary>
        /// <param name="entity">The user entity to create.</param>
        /// <param name="ct">A cancellation token to observe while waiting for the task to complete.</param>
        /// <returns>The newly created and logged-in <see cref="User"/> entity.</returns>
        private async Task<SessionUserDto> SignupAsync(User entity, CancellationToken ct = default)
        {
            UserValidator.ValidateNickname(entity.Nickname);

            do
            {
                entity.Discriminator = DiscriminatorHelper.GetRandomDiscriminator();
            }
            while (await Context.Users.AnyAsync(u => u.Nickname == entity.Nickname && u.Discriminator == entity.Discriminator, ct));

            entity.AvatarUrl = GetRandomAvatar();
            entity.CreationDate = DateTime.UtcNow;
            entity.ModificationDate = DateTime.UtcNow;

            await CreateAsync(entity, ct);
            await AssignSignupRoleAsync(entity, ct);
            return await ToSessionAsync(await LoginAsync(entity, ct), ct);
        }

        /// <summary>
        /// Updates an existing user's connection-related data when they log in.
        /// This method refreshes the <see cref="User.LastConnection"/> and <see cref="User.ModificationDate"/> fields,
        /// persists the changes, and retrieves the updated user from the database.
        /// </summary>
        /// <param name="entity">The existing user entity to update.</param>
        /// <param name="ct">A cancellation token to observe while waiting for the task to complete.</param>
        /// <returns>The updated <see cref="User"/> entity after successful login.</returns>
        private async Task<User> LoginAsync(User entity, CancellationToken ct = default)
        {
            entity.LastConnection = DateTime.UtcNow;
            entity.ModificationDate = DateTime.UtcNow;
            await UpdateAsync(entity.Id, entity, ct);
            await EnsureSiteRoleAsync(entity, ct);

            return await GetAsync(entity.Id, ct);
        }

        private async Task AssignSignupRoleAsync(User entity, CancellationToken ct)
        {
            var code = await ShouldBootstrapAdminAsync(entity, ct)
                ? SiteRoleCodes.Admin
                : SiteRoleCodes.Member;
            await ReplaceSiteRoleAsync(entity.Id, code, ct);
        }

        private async Task EnsureSiteRoleAsync(User entity, CancellationToken ct)
        {
            var hasRole = await Context.UserSiteRoles.AnyAsync(r => r.IdUser == entity.Id, ct);
            if (hasRole)
            {
                if (await ShouldBootstrapAdminAsync(entity, ct))
                    await ReplaceSiteRoleAsync(entity.Id, SiteRoleCodes.Admin, ct);
                return;
            }

            await AssignSignupRoleAsync(entity, ct);
        }

        private async Task<bool> ShouldBootstrapAdminAsync(User entity, CancellationToken ct)
        {
            if (AuthZ.BootstrapAdminKeycloakId is not Guid bootstrapId || bootstrapId == Guid.Empty)
                return false;
            if (entity.IdKeycloak != bootstrapId)
                return false;

            return !await Context.UserSiteRoles.AnyAsync(
                r => r.IdSiteRoleNavigation.Code == SiteRoleCodes.Admin,
                ct);
        }

        private async Task ReplaceSiteRoleAsync(int userId, string code, CancellationToken ct)
        {
            var role = await Context.SiteRoles.FirstOrDefaultAsync(r => r.Code == code, ct)
                ?? throw new InternalServerErrorException("ROLE_MISSING", $"Site role {code} is not seeded");

            var existing = await Context.UserSiteRoles.Where(r => r.IdUser == userId).ToListAsync(ct);
            Context.UserSiteRoles.RemoveRange(existing);
            Context.UserSiteRoles.Add(new UserSiteRole { IdUser = userId, IdSiteRole = role.Id });
            await Context.SaveChangesAsync(ct);
        }

        private async Task<SessionUserDto> ToSessionAsync(User user, CancellationToken ct)
        {
            var siteRoles = await CallerAuth.LoadSiteRoleCodesAsync(Context, user.Id, ct);
            var gameRoles = await Context.UserGameRoles.AsNoTracking()
                .Where(r => r.IdUser == user.Id)
                .Select(r => new GameRoleAssignmentDto
                {
                    GameUrlValue = r.IdGameRoleNavigation.IdGameNavigation.UrlValue,
                    Code = r.IdGameRoleNavigation.Code,
                })
                .ToListAsync(ct);

            var mute = await CallerAuth.ActiveMuteAsync(Context, user.Id, ct);

            return new SessionUserDto
            {
                Id = user.Id,
                PublicId = user.PublicId,
                Nickname = user.Nickname,
                Discriminator = user.Discriminator,
                AvatarUrl = user.AvatarUrl,
                Mail = user.Mail,
                LastConnection = user.LastConnection,
                IdKeycloak = user.IdKeycloak,
                SiteRoles = siteRoles,
                GameRoles = gameRoles,
                ActiveMute = mute is { EndDate: { } end }
                    ? new ActiveMuteDto { Reason = mute.Entitled, EndDate = end }
                    : null,
            };
        }

        private static StaffUserDto ToStaffUser(User user) => new()
        {
            Id = user.Id,
            PublicId = user.PublicId,
            Nickname = user.Nickname,
            Discriminator = user.Discriminator,
            AvatarUrl = user.AvatarUrl,
            LastConnection = user.LastConnection,
            SiteRoles = user.UserSiteRoles.Select(r => r.IdSiteRoleNavigation.Code).ToList(),
            GameRoles = user.UserGameRoles.Select(r => new GameRoleAssignmentDto
            {
                GameUrlValue = r.IdGameRoleNavigation.IdGameNavigation.UrlValue,
                Code = r.IdGameRoleNavigation.Code,
            }).ToList(),
            Sanction = CallerAuth.ActiveSanctionLabel(user.BannedIdUserBanNavigations),
        };

        private string GetRandomAvatar()
        {
            lock (Random)
                return BuildAvatarUrl(Random.Next(AppSettings.AvatarSettings.MinRangeAvatarId, AppSettings.AvatarSettings.MaxRangeAvatarId + 1));
        }

        private string BuildAvatarUrl(int avatarId) =>
            $"{AppSettings.AvatarSettings.AvatarBaseUrl.TrimEnd('/')}/{avatarId}.png";
    }
}
