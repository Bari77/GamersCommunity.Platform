using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Right : IKeyTable
{
    public int Id { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Entitled { get; set; } = null!;

    public virtual ICollection<RankRight> RankRights { get; set; } = new List<RankRight>();
}
