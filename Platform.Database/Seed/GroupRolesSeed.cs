using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class GroupRolesSeed : ReferenceTableSeed<GamersCommunityDbContext, GroupRole>
{
    protected override string TableName => nameof(GamersCommunityDbContext.GroupRoles);

    protected override DbSet<GroupRole> GetSet(GamersCommunityDbContext db) => db.GroupRoles;

    protected override int GetId(GroupRole entity) => entity.Id;

    protected override IReadOnlyList<GroupRole> Rows { get; } =
    [
        new() { Id = 1, Code = "owner" },
        new() { Id = 2, Code = "admin" },
        new() { Id = 3, Code = "moderator" },
        new() { Id = 4, Code = "member" },
    ];
}
