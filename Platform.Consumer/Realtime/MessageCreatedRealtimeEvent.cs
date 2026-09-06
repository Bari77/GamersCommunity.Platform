namespace Platform.Consumer.Realtime;

public sealed class MessageCreatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.MessageCreated;
    public required string SenderKeycloak { get; init; }
    public required string ReceiverKeycloak { get; init; }
    public required MessageRealtimePayload Message { get; init; }
}

public sealed class MessageRealtimePayload
{
    public required int Id { get; init; }
    public required Guid PublicId { get; init; }
    public required string Content { get; init; }
    public required int IdSender { get; init; }
    public required int IdReceiver { get; init; }
    public bool IsRead { get; init; }
    public required DateTime CreationDate { get; init; }
    public int? ParentMessageId { get; init; }
    public string? ParentContent { get; init; }
}
