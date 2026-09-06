using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class CitiesSeed : KeyTableSeed<GamersCommunityDbContext, City>
{
    public override int Order => 5;

    protected override string TableName => nameof(GamersCommunityDbContext.Cities);

    protected override DbSet<City> GetSet(GamersCommunityDbContext db) => db.Cities;

    protected override IReadOnlyList<City> Rows { get; } =
    [
        new()
        {
            Id = 1,
            Name = "Paris",
            PostalCode = 75001,
            IdCountry = 1,
            CreationDate = SeedDates.Utc,
            ModificationDate = SeedDates.Utc,
        },
    ];
}
