namespace Platform.Consumer.Utils
{
    public static class DiscriminatorHelper
    {
        /// <summary>
        /// Get a random descriminator value
        /// </summary>
        /// <returns>Random descriminator value</returns>
        public static string GetRandomDiscriminator()
        {
            return new Random().Next(1, 10000).ToString("D4");
        }
    }
}
