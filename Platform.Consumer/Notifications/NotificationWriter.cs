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

        var user = await context.Users.AsNoTracking()
            .Where(u => u.Id == idUser)
            .Select(u => new { u.IdKeycloak })
            .FirstOrDefaultAsync(ct);

        if (user is null)
        {
            return entity;
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

        return entity;
    }
}
