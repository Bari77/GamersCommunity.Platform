using Platform.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Context;

public partial class GamersCommunityDbContext
{
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        ConfigureAuthZ(modelBuilder);
        PublicIdConvention.Apply(modelBuilder);
    }
}
