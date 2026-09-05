using MainSite.Database.Context;
using MainSite.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace MainSite.Database.Seed;

public sealed class FriendStatusesSeed : KeyTableSeed<GamersCommunityDbContext, FriendStatus>
{
    protected override string TableName => nameof(GamersCommunityDbContext.FriendStatuses);

    protected override DbSet<FriendStatus> GetSet(GamersCommunityDbContext db) => db.FriendStatuses;

    protected override IReadOnlyList<FriendStatus> Rows { get; } =
    [
        new() { Id = 1, Entitled = "pending", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 2, Entitled = "accepted", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 3, Entitled = "refused", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 4, Entitled = "blocked", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
    ];
}
