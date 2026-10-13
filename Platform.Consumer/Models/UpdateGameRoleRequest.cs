namespace Platform.Consumer.Models;

public sealed class UpdateGameRoleRequest
{
    public Guid TargetPublicId { get; set; }
    public string GameUrlValue { get; set; } = "";
    public string? Code { get; set; }
}
