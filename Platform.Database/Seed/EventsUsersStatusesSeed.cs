using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class EventsUsersStatusesSeed : KeyTableSeed<GamersCommunityDbContext, EventsUsersStatus>
{
    protected override string TableName => nameof(GamersCommunityDbContext.EventsUsersStatuses);

    protected override DbSet<EventsUsersStatus> GetSet(GamersCommunityDbContext db) => db.EventsUsersStatuses;

    protected override IReadOnlyList<EventsUsersStatus> Rows { get; } =
    [
        new() { Id = 1, Entitled = "interested", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 2, Entitled = "going", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 3, Entitled = "declined", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
    ];
}
