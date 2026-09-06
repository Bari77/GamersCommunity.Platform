using Platform.Database.Context;
using Platform.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace Platform.Database.Seed;

public sealed class EventsSeed : KeyTableSeed<GamersCommunityDbContext, Event>
{
    public override int Order => 30;

    protected override string TableName => nameof(GamersCommunityDbContext.Events);

    protected override DbSet<Event> GetSet(GamersCommunityDbContext db) => db.Events;

    protected override IReadOnlyList<Event> Rows { get; } =
    [
        new()
        {
            Id = 1,
            PublicId = Guid.Parse("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
            Title = "GamersCommunity Meetup — Paris",
            Description =
                "Local community meetup: meet guilds, share LFG tips, and walk through the platform together.",
            BeginDate = new DateTime(2027, 3, 15, 18, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2027, 3, 15, 22, 0, 0, DateTimeKind.Utc),
            IdCity = 1,
            PlaceName = "Le Tank",
            Address = "Rue de la Fontaine au Roi",
            NumAddress = 22,
            Places = 40,
            Active = true,
            CreationDate = SeedDates.Utc,
            ModificationDate = SeedDates.Utc,
        },
    ];
}
