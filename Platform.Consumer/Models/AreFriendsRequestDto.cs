namespace Platform.Consumer.Models;

/// <summary>
/// Asks whether two Platform users are accepted friends, for a game microservice gating a
/// friends-only page.
/// </summary>
/// <remarks>
/// Friendships are owned by Platform and never replicated into a game database, so the game asks
/// this action every time. It is an internal bus action and is not routed by the gateway.
/// </remarks>
public sealed class AreFriendsRequestDto
{
    public Guid FirstUserPublicId { get; init; }

    public Guid SecondUserPublicId { get; init; }
}
