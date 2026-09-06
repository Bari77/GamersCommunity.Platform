namespace Platform.Consumer.Realtime;

public sealed class ReportQueueUpdatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.ReportQueueUpdated;
    public required string[] RecipientKeycloaks { get; init; }
    public required int OpenCount { get; init; }
}
