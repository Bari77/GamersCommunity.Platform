using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Post : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public int IdAuthor { get; set; }

    public string Body { get; set; } = null!;

    public string? MediaUrl { get; set; }

    public string? MediaKind { get; set; }

    public int IdStatus { get; set; }

    public virtual User IdAuthorNavigation { get; set; } = null!;

    public virtual PostStatus IdStatusNavigation { get; set; } = null!;
}
