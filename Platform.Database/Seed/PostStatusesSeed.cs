using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class PostStatusesSeed : KeyTableSeed<GamersCommunityDbContext, PostStatus>
{
    public override int Order => 5;

    protected override string TableName => nameof(GamersCommunityDbContext.PostStatuses);

    protected override DbSet<PostStatus> GetSet(GamersCommunityDbContext db) => db.PostStatuses;

    protected override IReadOnlyList<PostStatus> Rows { get; } =
    [
        new() { Id = 1, Entitled = "draft", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 2, Entitled = "published", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
        new() { Id = 3, Entitled = "hidden", CreationDate = SeedDates.Utc, ModificationDate = SeedDates.Utc },
    ];
}
