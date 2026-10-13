namespace Platform.Consumer.Models;

public sealed class CreateSanctionRequest
{
    public Guid TargetPublicId { get; set; }
    public string Kind { get; set; } = "";
    public string Entitled { get; set; } = "";
    public DateTime? EndDate { get; set; }
}
