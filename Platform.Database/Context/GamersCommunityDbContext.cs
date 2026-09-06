using System;
using System.Collections.Generic;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Context;

public partial class GamersCommunityDbContext : DbContext
{
    public GamersCommunityDbContext(DbContextOptions<GamersCommunityDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Banned> Banneds { get; set; }

    public virtual DbSet<City> Cities { get; set; }

    public virtual DbSet<Country> Countries { get; set; }

    public virtual DbSet<Event> Events { get; set; }

    public virtual DbSet<EventsUsersInterest> EventsUsersInterests { get; set; }

    public virtual DbSet<EventsUsersStatus> EventsUsersStatuses { get; set; }

    public virtual DbSet<Friend> Friends { get; set; }

    public virtual DbSet<Conversation> Conversations { get; set; }

    public virtual DbSet<ConversationMember> ConversationMembers { get; set; }

    public virtual DbSet<FriendStatus> FriendStatuses { get; set; }

    public virtual DbSet<Game> Games { get; set; }

    public virtual DbSet<GameRole> GameRoles { get; set; }

    public virtual DbSet<GameType> GameTypes { get; set; }

    public virtual DbSet<GroupRole> GroupRoles { get; set; }

    public virtual DbSet<Message> Messages { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Post> Posts { get; set; }

    public virtual DbSet<PostStatus> PostStatuses { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Rank> Ranks { get; set; }

    public virtual DbSet<RankRight> RankRights { get; set; }

    public virtual DbSet<Right> Rights { get; set; }

    public virtual DbSet<SiteRole> SiteRoles { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserGameRole> UserGameRoles { get; set; }

    public virtual DbSet<UserGroupRole> UserGroupRoles { get; set; }

    public virtual DbSet<UserSiteRole> UserSiteRoles { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Banned>(entity =>
        {
            entity.ToTable("Banned");

            entity.Property(e => e.BeginDate).HasColumnType("datetime");
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(255);
            entity.Property(e => e.Kind).HasMaxLength(16).IsRequired();
            entity.Property(e => e.RevokedAt).HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasIndex(e => new { e.IdUserBan, e.Kind, e.RevokedAt });

            entity.HasOne(d => d.IdModoNavigation).WithMany(p => p.BannedIdModoNavigations)
                .HasForeignKey(d => d.IdModo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Banned_Modo");

            entity.HasOne(d => d.IdUserBanNavigation).WithMany(p => p.BannedIdUserBanNavigations)
                .HasForeignKey(d => d.IdUserBan)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Banned_Users");
        });

        modelBuilder.Entity<City>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_City");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.PostalCode).HasColumnType("numeric(10, 0)");

            entity.HasOne(d => d.IdCountryNavigation).WithMany(p => p.Cities)
                .HasForeignKey(d => d.IdCountry)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_City_Countries");
        });

        modelBuilder.Entity<Country>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Country");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Name).HasMaxLength(255);
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.BeginDate).HasColumnType("datetime");
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.Image).HasMaxLength(255);
            entity.Property(e => e.Link).HasMaxLength(255);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.PlaceName).HasMaxLength(255);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.IdCityNavigation).WithMany(p => p.Events)
                .HasForeignKey(d => d.IdCity)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Events_City");
        });

        modelBuilder.Entity<EventsUsersInterest>(entity =>
        {
            entity.ToTable("EventsUsersInterest");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdEventNavigation).WithMany(p => p.EventsUsersInterests)
                .HasForeignKey(d => d.IdEvent)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EventsUsersInterest_Events");

            entity.HasOne(d => d.IdStatusNavigation).WithMany(p => p.EventsUsersInterests)
                .HasForeignKey(d => d.IdStatus)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EventsUsersInterest_EventsTypeStatusUser");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.EventsUsersInterests)
                .HasForeignKey(d => d.IdUser)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_EventsUsersInterest_Users");
        });

        modelBuilder.Entity<EventsUsersStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Id");

            entity.ToTable("EventsUsersStatus");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(150);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Friend>(entity =>
        {
            entity.ToTable("Friend");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdFriendAskingNavigation).WithMany(p => p.FriendIdFriendAskingNavigations)
                .HasForeignKey(d => d.IdFriendAsking)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Friend_UsersAsking");

            entity.HasOne(d => d.IdFriendReceiveNavigation).WithMany(p => p.FriendIdFriendReceiveNavigations)
                .HasForeignKey(d => d.IdFriendReceive)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Friend_UsersReceive");

            entity.HasOne(d => d.IdFriendStatusNavigation).WithMany(p => p.Friends)
                .HasForeignKey(d => d.IdFriendStatus)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Friend_FriendRequestStatus");
        });

        modelBuilder.Entity<FriendStatus>(entity =>
        {
            entity.ToTable("FriendStatus");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(150);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Game>(entity =>
        {
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Picture).HasMaxLength(255);
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.UrlValue).HasMaxLength(255);

            entity.HasOne(d => d.IdTypeNavigation).WithMany(p => p.Games)
                .HasForeignKey(d => d.IdType)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Games_GameType");
        });

        modelBuilder.Entity<GameType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_GameType");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(255);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Conversation");

            entity.Property(e => e.Kind).HasMaxLength(16).IsRequired();
            entity.Property(e => e.Title).HasMaxLength(80);
            entity.Property(e => e.PictureUrl).HasMaxLength(255);
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdOwnerNavigation).WithMany(p => p.ConversationsOwned)
                .HasForeignKey(d => d.IdOwner)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Conversation_Owner");
        });

        modelBuilder.Entity<ConversationMember>(entity =>
        {
            entity.HasKey(e => new { e.IdConversation, e.IdUser });

            entity.Property(e => e.JoinedAt).HasColumnType("datetime");
            entity.Property(e => e.LastReadAt).HasColumnType("datetime");
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdConversationNavigation).WithMany(p => p.Members)
                .HasForeignKey(d => d.IdConversation)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ConversationMember_Conversation");

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.ConversationMembers)
                .HasForeignKey(d => d.IdUser)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_ConversationMember_User");

            entity.HasIndex(e => e.IdUser);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(e => e.PublicId)
                .HasName("PK_Message")
                .IsClustered(false);

            entity.HasIndex(e => new { e.CreationDate, e.PublicId })
                .IsClustered();

            entity.HasIndex(e => new { e.IdConversation, e.CreationDate, e.PublicId });

            entity.Property(e => e.Content).HasColumnType("text");
            entity.Property(e => e.Kind)
                .HasMaxLength(32)
                .IsRequired()
                .HasDefaultValue(MessageKind.Text);
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdConversationNavigation).WithMany(p => p.Messages)
                .HasForeignKey(d => d.IdConversation)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Messages_Conversation");

            entity.HasOne(d => d.IdSenderNavigation).WithMany(p => p.MessageIdSenderNavigations)
                .HasForeignKey(d => d.IdSender)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Messages_Sender");

            entity.HasOne(d => d.ParentMessage).WithMany(p => p.Replies)
                .HasForeignKey(d => d.ParentPublicId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Messages_Parent");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notification");

            entity.Property(e => e.Body).HasMaxLength(2000);
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Kind).HasMaxLength(64);
            entity.Property(e => e.LinkUrl).HasMaxLength(500);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.PayloadJson).HasColumnType("nvarchar(max)");
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.IdUserNavigation).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.IdUser)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notification_User");
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.ToTable("Post");

            entity.Property(e => e.Body).HasMaxLength(4000);
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.MediaKind).HasMaxLength(32);
            entity.Property(e => e.MediaUrl).HasMaxLength(500);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdAuthorNavigation).WithMany(p => p.Posts)
                .HasForeignKey(d => d.IdAuthor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Post_Author");

            entity.HasOne(d => d.IdStatusNavigation).WithMany(p => p.Posts)
                .HasForeignKey(d => d.IdStatus)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Post_Status");
        });

        modelBuilder.Entity<PostStatus>(entity =>
        {
            entity.ToTable("PostStatus");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(150);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.ToTable("Reports");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Reason).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(16).IsRequired();
            entity.Property(e => e.LinkUrl).HasMaxLength(500);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.IdTarget);

            entity.HasOne(d => d.IdReporterNavigation).WithMany(p => p.ReportIdReporterNavigations)
                .HasForeignKey(d => d.IdReporter)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reports_Reporter");

            entity.HasOne(d => d.IdTargetNavigation).WithMany(p => p.ReportIdTargetNavigations)
                .HasForeignKey(d => d.IdTarget)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reports_Target");
        });

        modelBuilder.Entity<Rank>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Rank");

            entity.Property(e => e.Color)
                .HasMaxLength(6)
                .IsUnicode(false);
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(150);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<RankRight>(entity =>
        {
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");

            entity.HasOne(d => d.IdRankNavigation).WithMany(p => p.RankRights)
                .HasForeignKey(d => d.IdRank)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RankRights_Ranks");

            entity.HasOne(d => d.IdRightNavigation).WithMany(p => p.RankRights)
                .HasForeignKey(d => d.IdRight)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RankRights_Rights");
        });

        modelBuilder.Entity<Right>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Right");

            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Entitled).HasMaxLength(150);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK_Uusers");

            entity.HasIndex(e => e.Mail, "IX_Users").IsUnique();

            entity.Property(e => e.AvatarUrl).HasMaxLength(255);
            entity.Property(e => e.CreationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Discriminator).HasMaxLength(4);
            entity.Property(e => e.LastConnection).HasColumnType("datetime");
            entity.Property(e => e.Mail).HasMaxLength(255);
            entity.Property(e => e.ModificationDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Nickname).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
