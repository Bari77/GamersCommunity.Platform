namespace Platform.Consumer.Realtime;

public sealed class ConversationUpdatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.ConversationUpdated;
    public required string[] RecipientKeycloaks { get; init; }
    public required Guid ConversationPublicId { get; init; }
    public bool Deleted { get; init; }
}
