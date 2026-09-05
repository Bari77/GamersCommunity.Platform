using MainSite.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace MainSite.Database.Context;

public partial class GamersCommunityDbContext
{
    private static void ConfigureAuthZ(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SiteRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<UserSiteRole>(entity =>
        {
            entity.HasKey(e => new { e.IdUser, e.IdSiteRole });
            entity.HasOne(d => d.IdUserNavigation).WithMany()
                .HasForeignKey(d => d.IdUser)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.IdSiteRoleNavigation).WithMany(p => p.UserSiteRoles)
                .HasForeignKey(d => d.IdSiteRole)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GameRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => new { e.IdGame, e.Code }).IsUnique();
            entity.HasOne(d => d.IdGameNavigation).WithMany()
                .HasForeignKey(d => d.IdGame)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<UserGameRole>(entity =>
        {
            entity.HasKey(e => new { e.IdUser, e.IdGameRole });
            entity.HasOne(d => d.IdUserNavigation).WithMany()
                .HasForeignKey(d => d.IdUser)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.IdGameRoleNavigation).WithMany(p => p.UserGameRoles)
                .HasForeignKey(d => d.IdGameRole)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GroupRole>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<UserGroupRole>(entity =>
        {
            entity.HasKey(e => new { e.IdUser, e.IdGroup });
            entity.HasOne(d => d.IdUserNavigation).WithMany()
                .HasForeignKey(d => d.IdUser)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.IdGroupRoleNavigation).WithMany(p => p.UserGroupRoles)
                .HasForeignKey(d => d.IdGroupRole)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
