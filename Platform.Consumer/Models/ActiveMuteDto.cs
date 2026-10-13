namespace Platform.Consumer.Models;

public sealed class ActiveMuteDto
{
    public string Reason { get; init; } = "";
    public DateTime EndDate { get; init; }
}
