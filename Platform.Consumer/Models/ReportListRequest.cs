namespace Platform.Consumer.Models;

public sealed class ReportListRequest
{
    public string? Status { get; set; }
    public Guid? AfterPublicId { get; set; }
    public DateTime? AfterCreationDate { get; set; }
    public int Take { get; set; } = 25;
}
