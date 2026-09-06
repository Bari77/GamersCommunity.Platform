using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Serialization;
using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Consumer.Services.Data;

public class EventsUsersInterestsService(GamersCommunityDbContext context)
    : GenericDataService<GamersCommunityDbContext, EventsUsersInterest>(context, "EventsUsersInterests")
{
    private const int StatusInterested = 1;
    private const int StatusGoing = 2;
    private const int StatusDeclined = 3;

    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        switch (message.Action.ToUpperInvariant())
        {
            case "LIST":
                return JsonSafe.Serialize(await ListMineAsync(message, ct));
            case "CREATE":
                return JsonSafe.Serialize(await UpsertMineAsync(message, ct));
            case "UPDATE":
                return JsonSafe.Serialize(await UpdateMineAsync(message, ct));
            case "GET":
                return JsonSafe.Serialize(await GetMineAsync(message, ct));
            default:
                return await base.HandleAsync(message, ct);
        }
    }

    private async Task<List<EventsUsersInterest>> ListMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        return await Context.EventsUsersInterests.AsNoTracking()
            .Where(i => i.IdUser == me)
            .OrderByDescending(i => i.ModificationDate)
            .ToListAsync(ct);
    }

    private async Task<int> UpsertMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<EventsUsersInterest>(message.Data);
        EnsureValidStatus(request.IdStatus);

        var eventExists = await Context.Events.AsNoTracking().AnyAsync(e => e.Id == request.IdEvent, ct);
        if (!eventExists)
            throw new NotFoundException("EVENT_NOT_FOUND", "Event not found");

        var existing = await Context.EventsUsersInterests
            .FirstOrDefaultAsync(i => i.IdEvent == request.IdEvent && i.IdUser == me, ct);

        if (existing is not null)
        {
            existing.IdStatus = request.IdStatus;
            existing.ModificationDate = DateTime.UtcNow;
            await Context.SaveChangesAsync(ct);
            return existing.Id;
        }

        var entity = new EventsUsersInterest
        {
            IdEvent = request.IdEvent,
            IdUser = me,
            IdStatus = request.IdStatus,
            CreationDate = DateTime.UtcNow,
            ModificationDate = DateTime.UtcNow,
        };
        await Context.EventsUsersInterests.AddAsync(entity, ct);
        await Context.SaveChangesAsync(ct);
        return entity.Id;
    }

    private async Task<bool> UpdateMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        if (string.IsNullOrEmpty(message.Data))
            throw new BadRequestException("DATA_MANDATORY", "Data mandatory");

        var request = ConsumerParamParser.ToObject<EventsUsersInterest>(message.Data);
        EnsureValidStatus(request.IdStatus);

        var interest = message.PublicId is Guid publicId
            ? await Context.EventsUsersInterests.FirstOrDefaultAsync(i => i.PublicId == publicId, ct)
            : message.Id is int id
                ? await Context.EventsUsersInterests.FirstOrDefaultAsync(i => i.Id == id, ct)
                : null;

        if (interest is null)
            throw new NotFoundException("NOT_FOUND", "Cannot find ressource");
        if (interest.IdUser != me)
            throw new ForbiddenException("FORBIDDEN", "Not the owner of this RSVP");

        interest.IdStatus = request.IdStatus;
        interest.ModificationDate = DateTime.UtcNow;
        await Context.SaveChangesAsync(ct);
        return true;
    }

    private async Task<EventsUsersInterest> GetMineAsync(BusMessage message, CancellationToken ct)
    {
        var me = await RequireCallerUserIdAsync(message, ct);
        var entity = await ResolveAsync(message, ct);
        if (entity.IdUser != me)
            throw new ForbiddenException("FORBIDDEN", "Not the owner of this RSVP");
        return entity;
    }

    private static void EnsureValidStatus(int status)
    {
        if (status is not (StatusInterested or StatusGoing or StatusDeclined))
            throw new BadRequestException("INVALID_STATUS", "RSVP status is not allowed");
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
