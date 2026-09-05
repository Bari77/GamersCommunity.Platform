namespace Platform.Database.Models;

public class UserSiteRole
{
    public int IdUser { get; set; }
    public int IdSiteRole { get; set; }

    public virtual User IdUserNavigation { get; set; } = null!;
    public virtual SiteRole IdSiteRoleNavigation { get; set; } = null!;
}
