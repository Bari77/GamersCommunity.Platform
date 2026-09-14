namespace Platform.Consumer.Models;

public sealed class FriendRelationDto
{
    public int Id { get; init; }
    public Guid PublicId { get; init; }
    public DateTime CreationDate { get; init; }
    public DateTime ModificationDate { get; init; }
    public int IdFriendAsking { get; init; }
    public int IdFriendReceive { get; init; }
    public int IdFriendStatus { get; init; }
    public int PeerId { get; init; }
    public Guid PeerPublicId { get; init; }
    public string PeerNickname { get; init; } = "";
    public string PeerDiscriminator { get; init; } = "";
    public string PeerAvatarUrl { get; init; } = "";
}

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

public sealed class AreFriendsResultDto
{
    public bool AreFriends { get; init; }
}
