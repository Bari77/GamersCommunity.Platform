using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Message : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Content { get; set; } = null!;

    public int IdSender { get; set; }

    public int IdReceiver { get; set; }

    public virtual User IdReceiverNavigation { get; set; } = null!;

    public virtual User IdSenderNavigation { get; set; } = null!;
}
