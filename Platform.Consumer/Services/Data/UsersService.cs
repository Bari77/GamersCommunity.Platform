using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Platform.Consumer.Configuration;
using Platform.Consumer.Models;
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
    public class UsersService(GamersCommunityDbContext context, IOptions<AppSettings> otps) : GenericDataService<GamersCommunityDbContext, User>(context, "Users")
    {
        /// <summary>
        /// Random number generator
        /// </summary>
        private static readonly Random Random = new();

        /// <summary>
        /// App settings options value
        /// </summary>
        private AppSettings AppSettings = otps.Value;

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
                        if (await Context.Banneds
                            .Where(w => w.IdUserBan == user.Id && w.BeginDate <= DateTime.UtcNow && DateTime.UtcNow <= w.EndDate)
                            .AnyAsync(ct))
                        {
                            throw new BadRequestException("BANNED", "Banned account");
                        }
                        return JsonSafe.Serialize(await LoginAsync(user, ct));
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
            }

            return await base.HandleAsync(message, ct);
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
        private async Task<User> SignupAsync(User entity, CancellationToken ct = default)
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
            return await LoginAsync(entity, ct);
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

            return await GetAsync(entity.Id, ct);
        }

        private string GetRandomAvatar()
        {
            lock (Random)
                return BuildAvatarUrl(Random.Next(AppSettings.AvatarSettings.MinRangeAvatarId, AppSettings.AvatarSettings.MaxRangeAvatarId + 1));
        }

        private string BuildAvatarUrl(int avatarId) =>
            $"{AppSettings.AvatarSettings.AvatarBaseUrl.TrimEnd('/')}/{avatarId}.png";
    }
}
