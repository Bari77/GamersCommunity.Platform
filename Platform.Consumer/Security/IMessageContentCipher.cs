namespace Platform.Consumer.Security;

public interface IMessageContentCipher
{
    string Encrypt(string plaintext);

    string Decrypt(string stored);
}
