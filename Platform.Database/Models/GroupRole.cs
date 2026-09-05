namespace Platform.Database.Models;

public class GroupRole
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;

    public virtual ICollection<UserGroupRole> UserGroupRoles { get; set; } = new List<UserGroupRole>();
}
