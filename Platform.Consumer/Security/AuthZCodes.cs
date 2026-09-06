namespace Platform.Consumer.Security;

public static class SiteRoleCodes
{
    public const string Admin = "admin";
    public const string Moderator = "moderator";
    public const string Member = "member";
}

public static class GameRoleCodes
{
    public const string Admin = "admin";
    public const string Moderator = "moderator";
    public const string Member = "member";
}

public static class SanctionKinds
{
    public const string Mute = "mute";
    public const string Ban = "ban";
}

public static class ReportStatuses
{
    public const string Open = "open";
    public const string Actioned = "actioned";
    public const string Dismissed = "dismissed";
}

public static class SanctionFilters
{
    public const string None = "none";
    public const string Muted = "muted";
    public const string Banned = "banned";
}
