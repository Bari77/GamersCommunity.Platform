namespace Platform.Database.Models;

// IdGroup is owned by the game microservice (no local Groups table).
public class UserGroupRole
{
    public int IdUser { get; set; }
    public int IdGroup { get; set; }
    public int IdGroupRole { get; set; }

    public virtual User IdUserNavigation { get; set; } = null!;
    public virtual GroupRole IdGroupRoleNavigation { get; set; } = null!;
}
