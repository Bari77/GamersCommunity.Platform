using System.Reflection;
using Microsoft.Extensions.Logging;

namespace Platform.Database.Seed;

public interface IReferenceTableSeed<in TContext>
{
    int Order { get; }

    Task<SeedTotals> EnsureAsync(TContext db, ILogger logger, CancellationToken ct = default);
}

internal static class ReferenceTableSeedDiscovery
{
    public static IReadOnlyList<IReferenceTableSeed<TContext>> Discover<TContext>(Assembly assembly)
    {
        return assembly.GetTypes()
            .Where(t => t is { IsClass: true, IsAbstract: false })
            .Where(t => typeof(IReferenceTableSeed<TContext>).IsAssignableFrom(t))
            .Select(t => (IReferenceTableSeed<TContext>)Activator.CreateInstance(t)!)
            .OrderBy(s => s.Order)
            .ThenBy(s => s.GetType().Name, StringComparer.Ordinal)
            .ToArray();
    }
}
