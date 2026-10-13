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
