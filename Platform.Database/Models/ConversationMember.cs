namespace Platform.Database.Models;

public class ConversationMember
{
    public int IdConversation { get; set; }

    public int IdUser { get; set; }

    public DateTime JoinedAt { get; set; }

    public DateTime? LastReadAt { get; set; }

    public bool IsOwner { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public virtual Conversation IdConversationNavigation { get; set; } = null!;

    public virtual User IdUserNavigation { get; set; } = null!;
}
