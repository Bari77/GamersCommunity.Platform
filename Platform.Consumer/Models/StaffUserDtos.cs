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

public sealed class StaffUserDto
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
}

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

public sealed class CreateSanctionRequest
{
    public Guid TargetPublicId { get; set; }
    public string Kind { get; set; } = "";
    public string Entitled { get; set; } = "";
    public DateTime? EndDate { get; set; }
}

public sealed class UpdateSanctionRequest
{
    public bool Revoke { get; set; }
}

public sealed class UpdateSiteRoleRequest
{
    public Guid TargetPublicId { get; set; }
    public string Code { get; set; } = "";
}

public sealed class UpdateGameRoleRequest
{
    public Guid TargetPublicId { get; set; }
    public string GameUrlValue { get; set; } = "";
    public string? Code { get; set; }
}

public sealed class CreateReportRequest
{
    public Guid TargetPublicId { get; set; }
    public string Reason { get; set; } = "";
    public string? LinkUrl { get; set; }
}

public sealed class UpdateReportRequest
{
    public string Status { get; set; } = "";
}

public sealed class ReportListRequest
{
    public string? Status { get; set; }
    public Guid? AfterPublicId { get; set; }
    public DateTime? AfterCreationDate { get; set; }
    public int Take { get; set; } = 25;
}

public sealed class ReportOpenCountDto
{
    public int OpenCount { get; init; }
}

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
