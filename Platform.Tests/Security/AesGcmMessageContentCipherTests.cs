using Microsoft.Extensions.Options;
using Platform.Consumer.Configuration;
using Platform.Consumer.Security;

namespace Platform.Tests.Security;

public class AesGcmMessageContentCipherTests
{
    private static AesGcmMessageContentCipher CreateCipher() =>
        new(Options.Create(new MessageEncryptionSettings
        {
            Key = "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDA=",
        }));

    [Fact]
    public void Encrypt_hides_plaintext_and_decrypts_back()
    {
        var cipher = CreateCipher();
        const string plaintext = "secret whisper";

        var stored = cipher.Encrypt(plaintext);

        Assert.StartsWith(AesGcmMessageContentCipher.Prefix, stored);
        Assert.DoesNotContain(plaintext, stored);
        Assert.Equal(plaintext, cipher.Decrypt(stored));
    }

    [Fact]
    public void Decrypt_leaves_legacy_plaintext_unchanged()
    {
        var cipher = CreateCipher();
        const string legacy = "old unencrypted whisper";

        Assert.Equal(legacy, cipher.Decrypt(legacy));
    }
}
