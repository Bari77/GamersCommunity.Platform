using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class User : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Nickname { get; set; } = null!;

    public string Discriminator { get; set; } = null!;

    public string AvatarUrl { get; set; } = null!;

    public string? Mail { get; set; }

    public DateTime? LastConnection { get; set; }

    public Guid IdKeycloak { get; set; }

    public virtual ICollection<Banned> BannedIdModoNavigations { get; set; } = new List<Banned>();

    public virtual ICollection<Banned> BannedIdUserBanNavigations { get; set; } = new List<Banned>();

    public virtual ICollection<EventsUsersInterest> EventsUsersInterests { get; set; } = new List<EventsUsersInterest>();

    public virtual ICollection<Friend> FriendIdFriendAskingNavigations { get; set; } = new List<Friend>();

    public virtual ICollection<Friend> FriendIdFriendReceiveNavigations { get; set; } = new List<Friend>();

    public virtual ICollection<ConversationMember> ConversationMembers { get; set; } = new List<ConversationMember>();

    public virtual ICollection<Conversation> ConversationsOwned { get; set; } = new List<Conversation>();

    public virtual ICollection<Message> MessageIdSenderNavigations { get; set; } = new List<Message>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
}
