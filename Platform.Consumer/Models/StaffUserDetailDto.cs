namespace Platform.Consumer.Models;

public sealed class StaffUserDetailDto
{
    public int Id { get; init; }
    public Guid PublicId { get; init; }
    public string Nickname { get; init; } = "";
    public string Discriminator { get; init; } = "";
    public string AvatarUrl { get; init; } = "";
    public DateTime? LastConnection { get; init; }
    public IReadOnlyList<string> SiteRoles { get; init; } = [];
    public IReadOnlyList<GameRoleAssignmentDto> GameRoles { get; init; } = [];
    public string Sanction { get; init; } = "none";
    public IReadOnlyList<SanctionDto> Sanctions { get; init; } = [];
}
