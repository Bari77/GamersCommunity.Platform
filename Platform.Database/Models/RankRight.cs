using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class RankRight : IKeyTable
{
    public int Id { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public int IdRank { get; set; }

    public int IdRight { get; set; }

    public virtual Rank IdRankNavigation { get; set; } = null!;

    public virtual Right IdRightNavigation { get; set; } = null!;
}
