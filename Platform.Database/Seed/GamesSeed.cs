using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class GamesSeed : KeyTableSeed<GamersCommunityDbContext, Game>
{
    public override int Order => 20;

    protected override string TableName => nameof(GamersCommunityDbContext.Games);

    protected override DbSet<Game> GetSet(GamersCommunityDbContext db) => db.Games;

    protected override IReadOnlyList<Game> Rows { get; } =
    [
        new()
        {
            Id = 1,
            Title = "world_of_warcraft",
            UrlValue = "/world-of-warcraft",
            Picture = "world-of-warcraft",
            IdType = 1,
            CreationDate = SeedDates.Utc,
            ModificationDate = SeedDates.Utc,
        },
    ];
}
