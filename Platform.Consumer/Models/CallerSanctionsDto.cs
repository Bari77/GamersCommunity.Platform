namespace Platform.Consumer.Models;

/// <summary>
/// Active sanctions of the caller, answered to game microservices that must refuse a publication
/// server-side.
/// </summary>
/// <remarks>
/// Sanctions are deliberately never replicated into a game database, so every game-side check is a
/// synchronous call back to this action. It is an internal bus action and is not routed by the
/// gateway: players read their own mute through the session payload instead.
/// </remarks>
public sealed class CallerSanctionsDto
{
    public Guid UserPublicId { get; init; }

    public bool Banned { get; init; }

    public ActiveMuteDto? ActiveMute { get; init; }
}
