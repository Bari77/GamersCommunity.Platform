using System.Reflection;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Context;

internal static class PublicIdConvention
{
    public static void Apply(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clr = entityType.ClrType;
            var prop = clr.GetProperty("PublicId", BindingFlags.Public | BindingFlags.Instance);
            if (prop is null || prop.PropertyType != typeof(Guid))
                continue;

            var pk = entityType.FindPrimaryKey();
            var publicIdIsPrimaryKey = pk?.Properties.Count == 1 && pk.Properties[0].Name == "PublicId";

            modelBuilder.Entity(clr, b =>
            {
                b.Property<Guid>("PublicId")
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                if (!publicIdIsPrimaryKey)
                    b.HasIndex("PublicId").IsUnique();
            });
        }
    }
}
