using GamersCommunity.Core.Exceptions;
using GamersCommunity.Core.Logging;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Services;
using MainSite.Consumer.Configuration;
using MainSite.Consumer.Services.Infra;
using MainSite.Database.Context;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;

namespace MainSite.Consumer
{
    /// <summary>
    /// Entry point for the MainSite MicroService.
    /// Configures logging, dependency injection, and starts the RabbitMQ consumer worker.
    /// </summary>
    public class Program
    {
        /// <summary>
        /// Application entry point. Initializes configuration, logging, and service registration,
        /// then starts the host and keeps it alive until shutdown.
        /// </summary>
        /// <param name="args">Command-line arguments.</param>
        public static async Task Main(string[] args)
        {
            Console.Title = "MainSite MicroService";

            try
            {
                var builder = Host.CreateDefaultBuilder(args)
                    .ConfigureLogging((context, logging) =>
                    {
                        #region Initialize app settings

                        var loggerSettings = context.Configuration.GetSection("LoggerSettings").Get<LoggerSettings>() ?? new LoggerSettings();

                        #endregion

                        // Initialize Serilog with custom settings
                        Logger.Initialize(loggerSettings, "MainSite MS", context.HostingEnvironment);

                        // Remove default providers (Console, Debug, etc.)
                        // Only Serilog will be used afterwards
                        logging.ClearProviders();

                        Log.Information("Starting ...");
                    })
                    .ConfigureServices((context, services) =>
                    {
                        // Bind configuration sections to strongly-typed settings
                        services.AddOptions<RabbitMQSettings>().Bind(context.Configuration.GetSection("RabbitMQ")).ValidateOnStart();
                        services.AddOptions<AppSettings>().Bind(context.Configuration.GetSection("AppSettings")).ValidateOnStart();

                        // Register EF Core DbContext
                        services.AddDbContext<GamersCommunityDbContext>();

                        // Register application services
                        services.AddSingleton<Serilog.ILogger>(sp => Log.Logger);

                        services.Scan(scan => scan
                            .FromAssembliesOf(typeof(AppSettings))
                            .AddClasses(c => c.AssignableTo<IBusService>())
                            .AsImplementedInterfaces()
                            .WithScopedLifetime());
                        services.AddScoped<HealthService>();
                        services.AddScoped<BusRouter>();
                        services.AddScoped<MainSiteServiceConsumer>();

                        // Register the background worker that runs the consumer
                        services.AddHostedService<ConsumerWorker>();
                    });

                var host = builder.Build();

                var environment = host.Services.GetRequiredService<IHostEnvironment>();

                Log.Information("Started in {Environment} environment...", environment.EnvironmentName);

                await host.RunAsync();
            }
            catch (HostAbortedException ex)
            {
                Log.Fatal(ex, "Aborted.");
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Terminated unexpectedly.");
            }
            finally
            {
                Log.Information("Stopped ...");
            }
        }
    }
}
