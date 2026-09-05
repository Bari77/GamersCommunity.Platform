using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MainSite.Database.Seed;

public abstract class ReferenceTableSeed<TContext, TEntity> : IReferenceTableSeed<TContext>
    where TContext : DbContext
    where TEntity : class
{
    public virtual int Order => 0;

    protected abstract string TableName { get; }

    protected abstract IReadOnlyList<TEntity> Rows { get; }

    protected abstract DbSet<TEntity> GetSet(TContext db);

    protected abstract int GetId(TEntity entity);

    public async Task<SeedTotals> EnsureAsync(
        TContext db,
        ILogger logger,
        CancellationToken ct = default)
    {
        var set = GetSet(db);
        var inserted = 0;
        var updated = 0;
        var unchanged = 0;

        foreach (var row in Rows)
        {
            var id = GetId(row);
            var existing = await set.FindAsync([id], ct);
            if (existing is null)
            {
                set.Add(row);
                inserted++;
                logger.LogDebug("Seed {Table}: insert Id={Id}", TableName, id);
                continue;
            }

            var entry = set.Entry(existing);
            entry.CurrentValues.SetValues(row);
            if (entry.Properties.Any(p => p.IsModified))
            {
                updated++;
                logger.LogDebug("Seed {Table}: update Id={Id}", TableName, id);
            }
            else
            {
                unchanged++;
            }
        }

        logger.LogInformation(
            "Seed {Table}: {Inserted} inserted, {Updated} updated, {Unchanged} unchanged",
            TableName, inserted, updated, unchanged);

        return new SeedTotals(inserted, updated, unchanged);
    }
}
