using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace Platform.Consumer
{
    /// <summary>
    /// Background worker that runs a RabbitMQ consumer as a hosted service.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This worker wraps a <see cref="PlatformServiceConsumer"/> and executes its
    /// <see cref="PlatformServiceConsumer.StartListeningAsync(CancellationToken)"/> method
    /// inside the ASP.NET Core hosting environment.
    /// </para>
    /// <para>
    /// It ensures that the consumer is automatically started when the host starts
    /// and stopped gracefully when the host shuts down.
    /// </para>
    /// </remarks>
    /// <remarks>
    /// Initializes a new instance of the <see cref="ConsumerWorker"/> class.
    /// </remarks>
    /// <param name="scopeFactory">The scope factory to get RabbitMQ consumer that will process messages.</param>
    /// <param name="logger">The application logger.</param>
    public class ConsumerWorker(IServiceScopeFactory scopeFactory, ILogger logger) : BackgroundService
    {
        /// <summary>
        /// Main execution loop of the background service.
        /// Starts the RabbitMQ consumer and keeps it alive until cancellation is requested.
        /// </summary>
        /// <param name="ct">Cancellation token triggered when the host is shutting down.</param>
        /// <returns>A task representing the execution of the consumer.</returns>
        /// <exception cref="Exception">
        /// Re-throws any unhandled exceptions to allow the container/orchestrator to restart the service.
        /// </exception>
        protected override async Task ExecuteAsync(CancellationToken ct)
        {
            using var scope = scopeFactory.CreateScope();
            var consumer = scope.ServiceProvider.GetRequiredService<PlatformServiceConsumer>();

            try
            {
                await consumer.StartListeningAsync(ct);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                logger.Information("ConsumerWorker stopping (cancellation requested).");
            }
            catch (Exception ex)
            {
                logger.Fatal(ex, "Fatal RabbitMQ communication error. Exiting so the container can restart.");
                throw;
            }
        }
    }
}
