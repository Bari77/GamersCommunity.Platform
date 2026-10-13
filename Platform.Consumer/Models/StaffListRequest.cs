namespace Platform.Consumer.Models;

public sealed class StaffListRequest
{
    public string? Query { get; set; }
    public string? SiteRole { get; set; }
    public string? Sanction { get; set; }
    public DateTime? LastConnectionAfter { get; set; }
    public DateTime? LastConnectionBefore { get; set; }
    public Guid? AfterPublicId { get; set; }
    public DateTime? AfterLastConnection { get; set; }
    public int Take { get; set; } = 25;
}
