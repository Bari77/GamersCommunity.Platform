namespace Platform.Consumer.Realtime;

public sealed class MessageCreatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.MessageCreated;
    public required string[] RecipientKeycloaks { get; init; }
    public required MessageRealtimePayload Message { get; init; }
}
