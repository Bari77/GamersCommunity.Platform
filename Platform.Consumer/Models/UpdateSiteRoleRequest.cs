namespace Platform.Consumer.Models;

public sealed class UpdateSiteRoleRequest
{
    public Guid TargetPublicId { get; set; }
    public string Code { get; set; } = "";
}
