using Platform.Database.Models;

namespace Platform.Consumer.Integration;

/// <summary>
/// Broadcasts the public identity of a user so that game microservices can keep their own
/// read model up to date without ever querying the Platform database.
/// </summary>
public interface IUserIdentityPublisher
{
    Task PublishAsync(User user, CancellationToken ct = default);
}
