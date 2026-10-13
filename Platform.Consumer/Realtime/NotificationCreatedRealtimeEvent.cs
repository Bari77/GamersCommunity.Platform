namespace Platform.Consumer.Realtime;

public sealed class NotificationCreatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.NotificationCreated;
    public required string RecipientKeycloak { get; init; }
    public required NotificationRealtimePayload Notification { get; init; }
}
