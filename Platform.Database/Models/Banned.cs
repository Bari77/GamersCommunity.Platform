using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Banned : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public string Entitled { get; set; } = null!;

    public string Kind { get; set; } = "ban";

    public DateTime BeginDate { get; set; }

    public DateTime? EndDate { get; set; }

    public DateTime? RevokedAt { get; set; }

    public int IdUserBan { get; set; }

    public int IdModo { get; set; }

    public virtual User IdModoNavigation { get; set; } = null!;

    public virtual User IdUserBanNavigation { get; set; } = null!;
}
