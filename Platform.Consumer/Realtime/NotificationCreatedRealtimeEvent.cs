using Platform.Consumer.Serialization;

namespace Platform.Consumer.Realtime;

public sealed class NotificationCreatedRealtimeEvent
{
    public string Type { get; init; } = RealtimeEventTypes.NotificationCreated;
    public required string RecipientKeycloak { get; init; }
    public required NotificationRealtimePayload Notification { get; init; }
}

public sealed class NotificationRealtimePayload
{
    public required int Id { get; init; }
    public required Guid PublicId { get; init; }
    public required int IdUser { get; init; }
    public required string Kind { get; init; }
    public required string Title { get; init; }
    public string? Body { get; init; }
    public string? LinkUrl { get; init; }
    public required bool IsRead { get; init; }
    public string? PayloadJson { get; init; }
    public required DateTime CreationDate { get; init; }

    public static NotificationRealtimePayload FromEntity(Platform.Database.Models.Notification n) => new()
    {
        Id = n.Id,
        PublicId = n.PublicId,
        IdUser = n.IdUser,
        Kind = n.Kind,
        Title = n.Title,
        Body = n.Body,
        LinkUrl = n.LinkUrl,
        IsRead = n.IsRead,
        PayloadJson = n.PayloadJson,
        CreationDate = UtcDateTimeJsonConverter.AsUtc(n.CreationDate),
    };
}
