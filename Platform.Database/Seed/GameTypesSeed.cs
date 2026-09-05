using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class GameTypesSeed : KeyTableSeed<GamersCommunityDbContext, GameType>
{
    public override int Order => 10;

    protected override string TableName => nameof(GamersCommunityDbContext.GameTypes);

    protected override DbSet<GameType> GetSet(GamersCommunityDbContext db) => db.GameTypes;

    protected override IReadOnlyList<GameType> Rows { get; } =
    [
        new() { Id = 1, Entitled = "mmorpg", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
    ];
}
