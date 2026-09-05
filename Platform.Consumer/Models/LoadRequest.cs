namespace Platform.Consumer.Models
{
    /// <summary>
    /// Load user request
    /// </summary>
    public class LoadRequest
    {
        /// <summary>
        /// Keycloak id
        /// </summary>
        public required Guid IdKeycloak { get; set; }
        /// <summary>
        /// Keycloak mail
        /// </summary>
        public string? Mail { get; set; }
        /// <summary>
        /// Choosed username
        /// </summary>
        public string? Nickname { get; set; }
    }
}
