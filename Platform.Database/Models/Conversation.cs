using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Conversation : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Kind { get; set; } = ConversationKind.Dm;

    public string? Title { get; set; }

    public string? PictureUrl { get; set; }

    /// <summary>
    /// Stable key for conversations whose membership is owned by another microservice
    /// (e.g. <c>wow:guild:{publicId}</c>). Null for ordinary DMs and player-created groups.
    /// </summary>
    public string? ManagedKey { get; set; }

    public int? IdOwner { get; set; }

    public virtual User? IdOwnerNavigation { get; set; }

    public virtual ICollection<ConversationMember> Members { get; set; } = new List<ConversationMember>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}
