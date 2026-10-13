using Platform.Consumer.Notifications;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data;

internal sealed class NoopNotificationWriter : INotificationWriter
{
    public Task<Notification?> CreateAsync(
        int idUser,
        string kind,
        string title,
        string? body,
        string? linkUrl,
        object? payload,
        CancellationToken ct = default) => Task.FromResult<Notification?>(null);

    public Task<Notification?> UpsertUnreadAsync(
        int idUser,
        string kind,
        string peerToken,
        string title,
        string? body,
        string? linkUrl,
        object payload,
        CancellationToken ct = default) => Task.FromResult<Notification?>(null);
}
