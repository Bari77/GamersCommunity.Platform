using GamersCommunity.Core.Services;
using Platform.Database.Context;

namespace Platform.Consumer.Services.Infra
{
    /// <summary>
    /// Provides the health-check implementation for the <c>Sample</c> microservice.
    /// This class inherits the generic <see cref="HealthService{TContext}"/> base class,
    /// which performs infrastructure-level diagnostics such as database connectivity tests.
    /// </summary>
    /// <remarks>
    /// <para>
    /// The gateway periodically sends a <c>Infra/Health/Check</c> message via RabbitMQ
    /// to verify that this microservice is alive and that its database connection
    /// is operational. The result is serialized and returned to the requester.
    /// </para>
    /// </remarks>
    /// <param name="context">
    /// The Entity Framework database context used to validate the health of the database connection.
    /// </param>
    public class HealthService(GamersCommunityDbContext context) : HealthService<GamersCommunityDbContext>(context)
    {
    }
}
