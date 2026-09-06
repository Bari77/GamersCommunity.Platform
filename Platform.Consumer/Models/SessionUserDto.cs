namespace Platform.Consumer.Models;

public sealed class SessionUserDto
{
    public int Id { get; init; }
    public Guid PublicId { get; init; }
    public string Nickname { get; init; } = "";
    public string Discriminator { get; init; } = "";
    public string AvatarUrl { get; init; } = "";
    public string? Mail { get; init; }
    public DateTime? LastConnection { get; init; }
    public Guid IdKeycloak { get; init; }
    public IReadOnlyList<string> SiteRoles { get; init; } = [];
    public IReadOnlyList<GameRoleAssignmentDto> GameRoles { get; init; } = [];
    public ActiveMuteDto? ActiveMute { get; init; }
}

public sealed class GameRoleAssignmentDto
{
    public string GameUrlValue { get; init; } = "";
    public string Code { get; init; } = "";
}

public sealed class ActiveMuteDto
{
    public string Reason { get; init; } = "";
    public DateTime EndDate { get; init; }
}
