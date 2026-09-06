using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Message : IHasPublicId
{
    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Content { get; set; } = null!;

    public int IdSender { get; set; }

    public int IdReceiver { get; set; }

    public bool IsRead { get; set; }

    public Guid? ParentPublicId { get; set; }

    public virtual User IdReceiverNavigation { get; set; } = null!;

    public virtual User IdSenderNavigation { get; set; } = null!;

    public virtual Message? ParentMessage { get; set; }

    public virtual ICollection<Message> Replies { get; set; } = new List<Message>();
}
