using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Platform.Consumer.Realtime;
using Platform.Database.Context;
using Platform.Database.Models;
using Serilog;
using ILogger = Serilog.ILogger;

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

public sealed class NotificationWriter(
    GamersCommunityDbContext context,
    IRealtimeEventPublisher realtimePublisher,
    ILogger logger) : INotificationWriter
{
    public async Task<Notification?> CreateAsync(
        int idUser,
        string kind,
        string title,
        string? body,
        string? linkUrl,
        object? payload,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var entity = new Notification
        {
            PublicId = Guid.NewGuid(),
            IdUser = idUser,
            Kind = kind,
            Title = title,
            Body = body,
            LinkUrl = linkUrl,
            IsRead = false,
            PayloadJson = payload is null ? null : JsonSerializer.Serialize(payload),
            CreationDate = now,
            ModificationDate = now,
        };

        await context.Notifications.AddAsync(entity, ct);
        await context.SaveChangesAsync(ct);
        await PublishCreatedAsync(entity, ct);
        return entity;
    }

    public async Task<Notification?> UpsertUnreadAsync(
        int idUser,
        string kind,
        string peerToken,
        string title,
        string? body,
        string? linkUrl,
        object payload,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var existing = await context.Notifications
            .Where(n =>
                n.IdUser == idUser
                && !n.IsRead
                && n.Kind == kind
                && n.PayloadJson != null
                && n.PayloadJson.Contains(peerToken))
            .OrderByDescending(n => n.ModificationDate)
            .FirstOrDefaultAsync(ct);

        if (existing is null)
        {
            return await CreateAsync(idUser, kind, title, body, linkUrl, payload, ct);
        }

        existing.Title = title;
        existing.Body = body;
        existing.LinkUrl = linkUrl;
        existing.PayloadJson = JsonSerializer.Serialize(payload);
        existing.ModificationDate = now;
        existing.CreationDate = now;
        await context.SaveChangesAsync(ct);
        await PublishCreatedAsync(existing, ct);
        return existing;
    }

    private async Task PublishCreatedAsync(Notification entity, CancellationToken ct)
    {
        var user = await context.Users.AsNoTracking()
            .Where(u => u.Id == entity.IdUser)
            .Select(u => new { u.IdKeycloak })
            .FirstOrDefaultAsync(ct);

        if (user is null)
        {
            return;
        }

        try
        {
            await realtimePublisher.PublishAsync(
                new NotificationCreatedRealtimeEvent
                {
                    RecipientKeycloak = user.IdKeycloak.ToString(),
                    Notification = NotificationRealtimePayload.FromEntity(entity),
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.Warning(ex, "Failed to publish notification.created for {PublicId}.", entity.PublicId);
        }
    }
}
