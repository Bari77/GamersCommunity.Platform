using GamersCommunity.Core.Database;

namespace MainSite.Database.Seed;

public abstract class KeyTableSeed<TContext, TEntity> : ReferenceTableSeed<TContext, TEntity>
    where TContext : Microsoft.EntityFrameworkCore.DbContext
    where TEntity : class, IKeyTable
{
    protected sealed override int GetId(TEntity entity) => entity.Id;
}
