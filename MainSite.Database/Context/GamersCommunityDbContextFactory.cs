using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace MainSite.Database.Context;

/// <summary>
/// Factory used by EF Core tools (<c>dotnet ef</c>) at design-time.
/// </summary>
public class GamersCommunityDbContextFactory : IDesignTimeDbContextFactory<GamersCommunityDbContext>
{
    public GamersCommunityDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "../MainSite.Consumer");
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.Development.json", optional: false)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("Database")
            ?? throw new InvalidOperationException("Connection string 'Database' is missing.");

        var optionsBuilder = new DbContextOptionsBuilder<GamersCommunityDbContext>();
        optionsBuilder.UseSqlServer(connectionString);

        return new GamersCommunityDbContext(optionsBuilder.Options);
    }
}
