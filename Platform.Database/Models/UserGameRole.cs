namespace Platform.Database.Models;

public class UserGameRole
{
    public int IdUser { get; set; }
    public int IdGameRole { get; set; }

    public virtual User IdUserNavigation { get; set; } = null!;
    public virtual GameRole IdGameRoleNavigation { get; set; } = null!;
}
