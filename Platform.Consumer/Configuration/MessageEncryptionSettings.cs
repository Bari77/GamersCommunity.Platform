namespace Platform.Consumer.Configuration;

public class MessageEncryptionSettings
{
    public const string SectionName = "MessageEncryption";

    public string Key { get; set; } = "";
}
