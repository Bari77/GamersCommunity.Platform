namespace MainSite.Database.Models;

public class GameRole
{
    public int Id { get; set; }
    public int IdGame { get; set; }
    public string Code { get; set; } = null!;

    public virtual Game IdGameNavigation { get; set; } = null!;
    public virtual ICollection<UserGameRole> UserGameRoles { get; set; } = new List<UserGameRole>();
}
