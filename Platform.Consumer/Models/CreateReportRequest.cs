namespace Platform.Consumer.Models;

public sealed class CreateReportRequest
{
    public Guid TargetPublicId { get; set; }
    public string Reason { get; set; } = "";
    public string? LinkUrl { get; set; }
}
