namespace Platform.Consumer.Realtime;

public sealed class MessageCreatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.MessageCreated;
    public required string[] RecipientKeycloaks { get; init; }
    public required MessageRealtimePayload Message { get; init; }
}

public sealed class MessageRealtimePayload
{
    public required Guid PublicId { get; init; }
    public required Guid ConversationPublicId { get; init; }
    public required string Content { get; init; }
    public required int IdSender { get; init; }
    public required Guid SenderPublicId { get; init; }
    public required string SenderNickname { get; init; }
    public required string SenderDiscriminator { get; init; }
    public required string SenderAvatarUrl { get; init; }
    public required DateTime CreationDate { get; init; }
    public Guid? ParentPublicId { get; init; }
    public string? ParentContent { get; set; }
}

public sealed class ConversationUpdatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.ConversationUpdated;
    public required string[] RecipientKeycloaks { get; init; }
    public required Guid ConversationPublicId { get; init; }
    public bool Deleted { get; init; }
}
