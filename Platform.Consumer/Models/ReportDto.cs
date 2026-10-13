namespace Platform.Consumer.Models;

public sealed class ReportDto
{
    public Guid PublicId { get; init; }
    public Guid ReporterPublicId { get; init; }
    public string ReporterNickname { get; init; } = "";
    public string ReporterDiscriminator { get; init; } = "";
    public Guid TargetPublicId { get; init; }
    public string TargetNickname { get; init; } = "";
    public string TargetDiscriminator { get; init; } = "";
    public string TargetAvatarUrl { get; init; } = "";
    public string Reason { get; init; } = "";
    public string Status { get; init; } = "";
    public string? LinkUrl { get; init; }
    public DateTime CreationDate { get; init; }
}
