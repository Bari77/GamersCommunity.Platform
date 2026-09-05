using MainSite.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace MainSite.Database.Context;

public partial class GamersCommunityDbContext
{
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder)
    {
        ConfigureAuthZ(modelBuilder);
        PublicIdConvention.Apply(modelBuilder);
    }
}
