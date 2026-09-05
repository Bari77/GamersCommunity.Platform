using MainSite.Database.Context;
using MainSite.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace MainSite.Database.Seed;

public sealed class GameRolesSeed : ReferenceTableSeed<GamersCommunityDbContext, GameRole>
{
    public override int Order => 30;

    protected override string TableName => nameof(GamersCommunityDbContext.GameRoles);

    protected override DbSet<GameRole> GetSet(GamersCommunityDbContext db) => db.GameRoles;

    protected override int GetId(GameRole entity) => entity.Id;

    protected override IReadOnlyList<GameRole> Rows { get; } =
    [
        new() { Id = 1, IdGame = 1, Code = "admin" },
        new() { Id = 2, IdGame = 1, Code = "moderator" },
        new() { Id = 3, IdGame = 1, Code = "member" },
    ];
}
