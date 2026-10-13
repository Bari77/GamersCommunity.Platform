using GamersCommunity.Core.Events;
using Platform.Database.Models;
using Serilog;

namespace Platform.Consumer.Integration;

public sealed class UserIdentityPublisher(IIntegrationEventPublisher publisher, ILogger logger) : IUserIdentityPublisher
{
    public async Task PublishAsync(User user, CancellationToken ct = default)
    {
        var integrationEvent = new UserIdentityChangedEvent
        {
            UserPublicId = user.PublicId,
            Nickname = user.Nickname,
            Discriminator = user.Discriminator,
            AvatarUrl = user.AvatarUrl ?? string.Empty,
        };

        try
        {
            await publisher.PublishAsync(IntegrationExchanges.PlatformEvents, integrationEvent, ct);
        }
        catch (Exception ex)
        {
            // Broadcasting is best-effort: a broker hiccup must never fail the user's request.
            // Subscribers converge again on the next publication for this user.
            logger.Error(ex, "Failed to broadcast identity of user {PublicId}.", user.PublicId);
        }
    }
}
