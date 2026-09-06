namespace Platform.Consumer.Models;

public sealed class PublicUserProfile
{
    public int Id { get; init; }
    public Guid PublicId { get; init; }
    public string Nickname { get; init; } = "";
    public string Discriminator { get; init; } = "";
    public string AvatarUrl { get; init; } = "";
    public DateTime? LastConnection { get; init; }

    public static PublicUserProfile FromEntity(Platform.Database.Models.User user) => new()
    {
        Id = user.Id,
        PublicId = user.PublicId,
        Nickname = user.Nickname,
        Discriminator = user.Discriminator,
        AvatarUrl = user.AvatarUrl,
        LastConnection = user.LastConnection,
    };
}
