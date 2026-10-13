using Platform.Database.Models;

namespace Platform.Consumer.Notifications;

public interface INotificationWriter
{
    Task<Notification?> CreateAsync(
        int idUser,
        string kind,
        string title,
        string? body,
        string? linkUrl,
        object? payload,
        CancellationToken ct = default);

    Task<Notification?> UpsertUnreadAsync(
        int idUser,
        string kind,
        string peerToken,
        string title,
        string? body,
        string? linkUrl,
        object payload,
        CancellationToken ct = default);
}
