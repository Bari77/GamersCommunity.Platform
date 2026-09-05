using MainSite.Database.Context;
using Microsoft.Extensions.Logging;

namespace MainSite.Database.Seed;

public static class ReferenceDataSeed
{
    private static readonly IReadOnlyList<IReferenceTableSeed<GamersCommunityDbContext>> Tables =
        ReferenceTableSeedDiscovery.Discover<GamersCommunityDbContext>(typeof(ReferenceDataSeed).Assembly);

    public static async Task EnsureAsync(
        GamersCommunityDbContext db,
        ILogger logger,
        CancellationToken ct = default)
    {
        logger.LogInformation("Reference data seed starting ({TableCount} tables)", Tables.Count);
        foreach (var table in Tables)
            logger.LogDebug("Seed discovery: {Seed} (Order={Order})", table.GetType().Name, table.Order);

        var totals = SeedTotals.Zero;
        foreach (var table in Tables)
            totals += await table.EnsureAsync(db, logger, ct);

        if (totals.HasChanges)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Reference data seed saved: {Inserted} inserted, {Updated} updated, {Unchanged} unchanged",
                totals.Inserted, totals.Updated, totals.Unchanged);
        }
        else
        {
            logger.LogInformation(
                "Reference data seed already in sync ({Unchanged} rows unchanged)",
                totals.Unchanged);
        }
    }
}
