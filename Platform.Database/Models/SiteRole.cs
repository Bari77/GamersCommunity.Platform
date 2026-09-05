namespace Platform.Database.Models;

public class SiteRole
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;

    public virtual ICollection<UserSiteRole> UserSiteRoles { get; set; } = new List<UserSiteRole>();
}
