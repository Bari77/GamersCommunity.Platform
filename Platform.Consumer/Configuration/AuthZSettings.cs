namespace Platform.Consumer.Configuration;

public class AuthZSettings
{
    public const string SectionName = "AuthZ";

    public Guid? BootstrapAdminKeycloakId { get; set; }
}
