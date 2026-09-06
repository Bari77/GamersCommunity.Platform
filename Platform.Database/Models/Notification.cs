using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Notification : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public int IdUser { get; set; }

    public string Kind { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Body { get; set; }

    public string? LinkUrl { get; set; }

    public bool IsRead { get; set; }

    public string? PayloadJson { get; set; }

    public virtual User IdUserNavigation { get; set; } = null!;
}
