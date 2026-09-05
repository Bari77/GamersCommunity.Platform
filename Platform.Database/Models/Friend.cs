using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Friend : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public int IdFriendAsking { get; set; }

    public int IdFriendReceive { get; set; }

    public int IdFriendStatus { get; set; }

    public virtual User IdFriendAskingNavigation { get; set; } = null!;

    public virtual User IdFriendReceiveNavigation { get; set; } = null!;

    public virtual FriendStatus IdFriendStatusNavigation { get; set; } = null!;
}
