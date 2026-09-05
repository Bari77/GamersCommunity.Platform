namespace Platform.Consumer.Configuration
{
    /// <summary>
    /// Avatar settings
    /// </summary>
    public class AvatarSettings
    {
        /// <summary>
        /// Avatar base url
        /// </summary>
        public required string AvatarBaseUrl { get; set; }
        /// <summary>
        /// Min avatar id stored in AvatarBaseUrl
        /// </summary>
        public int MinRangeAvatarId { get; set; }
        /// <summary>
        /// Max avatar id stored in AvatarBaseUrl
        /// </summary>
        public int MaxRangeAvatarId { get; set; }
    }
}
