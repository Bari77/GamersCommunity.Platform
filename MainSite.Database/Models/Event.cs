using GamersCommunity.Core.Database;

namespace MainSite.Database.Models;

public partial class Event : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Title { get; set; } = null!;

    public DateTime BeginDate { get; set; }

    public DateTime EndDate { get; set; }

    public string Description { get; set; } = null!;

    public int IdCity { get; set; }

    public string? PlaceName { get; set; }

    public string? Address { get; set; }

    public int? NumAddress { get; set; }

    public string? Image { get; set; }

    public string? Link { get; set; }

    public int? Places { get; set; }

    public bool Active { get; set; }

    public virtual ICollection<EventsUsersInterest> EventsUsersInterests { get; set; } = new List<EventsUsersInterest>();

    public virtual City IdCityNavigation { get; set; } = null!;
}
