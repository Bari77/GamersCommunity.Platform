using MainSite.Database.Context;
using MainSite.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace MainSite.Database.Seed;

public sealed class SiteRolesSeed : ReferenceTableSeed<GamersCommunityDbContext, SiteRole>
{
    protected override string TableName => nameof(GamersCommunityDbContext.SiteRoles);

    protected override DbSet<SiteRole> GetSet(GamersCommunityDbContext db) => db.SiteRoles;

    protected override int GetId(SiteRole entity) => entity.Id;

    protected override IReadOnlyList<SiteRole> Rows { get; } =
    [
        new() { Id = 1, Code = "admin" },
        new() { Id = 2, Code = "moderator" },
        new() { Id = 3, Code = "member" },
    ];
}
