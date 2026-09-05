using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Game : IKeyTable
{
    public int Id { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Title { get; set; } = null!;

    public string UrlValue { get; set; } = null!;

    public string Picture { get; set; } = null!;

    public int IdType { get; set; }

    public virtual GameType IdTypeNavigation { get; set; } = null!;
}
