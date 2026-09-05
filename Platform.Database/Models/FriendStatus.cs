using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class FriendStatus : IKeyTable
{
    public int Id { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Entitled { get; set; } = null!;

    public virtual ICollection<Friend> Friends { get; set; } = new List<Friend>();
}
