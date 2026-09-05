using MainSite.Database.Context;
using MainSite.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace MainSite.Database.Seed;

public sealed class CountriesSeed : KeyTableSeed<GamersCommunityDbContext, Country>
{
    protected override string TableName => nameof(GamersCommunityDbContext.Countries);

    protected override DbSet<Country> GetSet(GamersCommunityDbContext db) => db.Countries;

    protected override IReadOnlyList<Country> Rows { get; } =
    [
        new() { Id = 1, Name = "france", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 2, Name = "belgium", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 3, Name = "switzerland", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 4, Name = "canada", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
    ];
}
