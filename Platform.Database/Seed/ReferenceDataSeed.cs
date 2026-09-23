using GamersCommunity.Core.Database.Seed;
using Microsoft.Extensions.Logging;
using Platform.Database.Context;

namespace Platform.Database.Seed;

public static class ReferenceDataSeed
{
    private static readonly IReadOnlyList<IReferenceTableSeed<GamersCommunityDbContext>> Tables =
        ReferenceTableSeedDiscovery.Discover<GamersCommunityDbContext>(typeof(ReferenceDataSeed).Assembly);

    public static Task EnsureAsync(
        GamersCommunityDbContext db,
        ILogger logger,
        CancellationToken ct = default) =>
        ReferenceDataSeedRunner.EnsureAsync(db, Tables, logger, ct);
}
