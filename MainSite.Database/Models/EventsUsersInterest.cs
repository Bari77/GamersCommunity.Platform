using GamersCommunity.Core.Database;

namespace MainSite.Database.Models;

public partial class EventsUsersInterest : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public int IdEvent { get; set; }

    public int IdUser { get; set; }

    public int IdStatus { get; set; }

    public virtual Event IdEventNavigation { get; set; } = null!;

    public virtual EventsUsersStatus IdStatusNavigation { get; set; } = null!;

    public virtual User IdUserNavigation { get; set; } = null!;
}
