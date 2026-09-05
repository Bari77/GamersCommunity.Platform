using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Context;

/// <summary>
/// Design-time DbContext configuration (<c>dotnet ef</c> tools).
/// At runtime, the connection string is injected via DI in <c>Platform.Consumer</c>.
/// </summary>
public partial class GamersCommunityDbContext
{
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlServer("Name=ConnectionStrings:Database");
        }
    }
}
