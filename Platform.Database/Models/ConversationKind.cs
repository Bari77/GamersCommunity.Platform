namespace Platform.Database.Models;

public static class ConversationKind
{
    public const string Dm = "dm";
    public const string Group = "group";

    /// <summary>
    /// Group whose members follow a guild roster. Players cannot add or remove anyone.
    /// </summary>
    public const string Guild = "guild";

    /// <summary>
    /// Group whose members follow a LoL team roster. Players cannot add or remove anyone.
    /// </summary>
    public const string Team = "team";
}
