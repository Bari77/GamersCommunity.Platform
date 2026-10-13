namespace Platform.Consumer.Models;

public sealed class SanctionDto
{
    public Guid PublicId { get; init; }
    public string Kind { get; init; } = "";
    public string Entitled { get; init; } = "";
    public DateTime BeginDate { get; init; }
    public DateTime? EndDate { get; init; }
    public DateTime? RevokedAt { get; init; }
    public Guid ModoPublicId { get; init; }
    public string ModoNickname { get; init; } = "";
    public bool Active { get; init; }
}
