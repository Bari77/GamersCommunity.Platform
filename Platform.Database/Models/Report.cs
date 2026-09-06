using GamersCommunity.Core.Database;

namespace Platform.Database.Models;

public partial class Report : IKeyTable
{
    public int Id { get; set; }

    public Guid PublicId { get; set; }

    public DateTime CreationDate { get; set; }

    public DateTime ModificationDate { get; set; }

    public int IdReporter { get; set; }

    public int IdTarget { get; set; }

    public string Reason { get; set; } = null!;

    public string Status { get; set; } = "open";

    public string? LinkUrl { get; set; }

    public virtual User IdReporterNavigation { get; set; } = null!;

    public virtual User IdTargetNavigation { get; set; } = null!;
}
