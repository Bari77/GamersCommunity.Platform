using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Platform.Consumer.Configuration;

namespace Platform.Consumer.Security;

public sealed class AesGcmMessageContentCipher(IOptions<MessageEncryptionSettings> options) : IMessageContentCipher
{
    public const string Prefix = "gc1.";
    private const int NonceSize = 12;
    private const int TagSize = 16;

    private readonly byte[] _key = DecodeKey(options.Value.Key);

    public string Encrypt(string plaintext)
    {
        ArgumentException.ThrowIfNullOrEmpty(plaintext);

        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var plainBytes = Encoding.UTF8.GetBytes(plaintext);
        var cipherBytes = new byte[plainBytes.Length];
        var tag = new byte[TagSize];

        using var aes = new AesGcm(_key, TagSize);
        aes.Encrypt(nonce, plainBytes, cipherBytes, tag);

        var packed = new byte[NonceSize + TagSize + cipherBytes.Length];
        nonce.CopyTo(packed, 0);
        tag.CopyTo(packed, NonceSize);
        cipherBytes.CopyTo(packed, NonceSize + TagSize);

        return Prefix + Convert.ToBase64String(packed);
    }

    public string Decrypt(string stored)
    {
        if (string.IsNullOrEmpty(stored) || !stored.StartsWith(Prefix, StringComparison.Ordinal))
            return stored;

        var packed = Convert.FromBase64String(stored[Prefix.Length..]);
        if (packed.Length < NonceSize + TagSize)
            throw new CryptographicException("Invalid encrypted message payload.");

        var nonce = packed.AsSpan(0, NonceSize);
        var tag = packed.AsSpan(NonceSize, TagSize);
        var cipherBytes = packed.AsSpan(NonceSize + TagSize);
        var plainBytes = new byte[cipherBytes.Length];

        using var aes = new AesGcm(_key, TagSize);
        aes.Decrypt(nonce, cipherBytes, tag, plainBytes);
        return Encoding.UTF8.GetString(plainBytes);
    }

    private static byte[] DecodeKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new InvalidOperationException("MessageEncryption:Key is missing.");

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(key);
        }
        catch (FormatException ex)
        {
            throw new InvalidOperationException("MessageEncryption:Key must be Base64.", ex);
        }

        if (bytes.Length != 32)
            throw new InvalidOperationException("MessageEncryption:Key must decode to 32 bytes.");

        return bytes;
    }
}
