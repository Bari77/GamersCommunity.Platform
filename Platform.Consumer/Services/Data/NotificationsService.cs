using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Microsoft.EntityFrameworkCore;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data;

public class NotificationsService(GamersCommunityDbContext context)
    : GenericDataService<GamersCommunityDbContext, Notification>(context, "Notifications")
{
    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        switch (message.Action.ToUpperInvariant())
        {
            case "LIST":
                return JsonSafe.Serialize(await ListMineAsync(message, ct));
            case "UPDATE":
                return JsonSafe.Serialize(await MarkReadAsync(message, ct));
            case "MARKALLREAD":
                return JsonSafe.Serialize(await MarkAllReadAsync(message, ct));
            default:
                return await base.HandleAsync(message, ct);
        }
    }

    private async Task<List<Notification>> ListMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        return await Context.Notifications.AsNoTracking()
            .Where(n => n.IdUser == me)
            .OrderByDescending(n => n.CreationDate)
            .Take(100)
            .ToListAsync(ct);
    }

    private async Task<bool> MarkReadAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var entity = message.PublicId is Guid publicId
            ? await Context.Notifications.FirstOrDefaultAsync(n => n.PublicId == publicId, ct)
            : message.Id is int id
                ? await Context.Notifications.FirstOrDefaultAsync(n => n.Id == id, ct)
                : null;

        if (entity is null)
            throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
        if (entity.IdUser != me)
            throw new ForbiddenException("FORBIDDEN", "Not the notification owner");

        if (!entity.IsRead)
        {
            entity.IsRead = true;
            entity.ModificationDate = DateTime.UtcNow;
            await Context.SaveChangesAsync(ct);
        }

        return true;
    }

    private async Task<int> MarkAllReadAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var now = DateTime.UtcNow;
        var unread = await Context.Notifications
            .Where(n => n.IdUser == me && !n.IsRead)
            .ToListAsync(ct);

        foreach (var item in unread)
        {
            item.IsRead = true;
            item.ModificationDate = now;
        }

        await Context.SaveChangesAsync(ct);
        return unread.Count;
    }

    private async Task<int> RequireCallerUserIdAsync(BusMessage message, CancellationToken ct)
    {
        if (message.Caller?.Subject is not { } subject || !Guid.TryParse(subject, out var idKeycloak))
            throw new UnauthorizedException("UNAUTHORIZED", "Authenticated caller required");

        var user = await Context.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.IdKeycloak == idKeycloak, ct);

        return user?.Id ?? throw new UnauthorizedException("UNAUTHORIZED", "Caller user not found");
    }
}
