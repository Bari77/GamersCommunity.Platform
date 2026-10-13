using Platform.Database.Models;

namespace Platform.Consumer.Realtime;

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
    public string Kind { get; init; } = MessageKind.Text;
    public Guid? ParentPublicId { get; init; }
    public string? ParentContent { get; set; }
}
