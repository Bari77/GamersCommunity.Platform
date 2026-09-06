namespace Platform.Consumer.Realtime;

public sealed class FriendUpdatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.FriendUpdated;
    public required string AskingKeycloak { get; init; }
    public required string ReceivingKeycloak { get; init; }
    public required int IdFriendAsking { get; init; }
    public required int IdFriendReceive { get; init; }
    public required int IdFriendStatus { get; init; }
    public required Guid PublicId { get; init; }
}
