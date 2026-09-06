using GamersCommunity.Core.Logging;
using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Services;
using Platform.Consumer.Configuration;
using Platform.Consumer.Realtime;
using Platform.Consumer.Security;
using Platform.Consumer.Services.Infra;
using Platform.Database.Context;
using Platform.Database.Seed;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;

namespace Platform.Consumer
{
    /// <summary>
    /// Entry point for the Platform MicroService.
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
            Console.Title = "Platform MicroService";

            try
            {
                var builder = Host.CreateDefaultBuilder(args)
                    .ConfigureLogging((context, logging) =>
                    {
                        #region Initialize app settings

                        var loggerSettings = context.Configuration.GetSection("LoggerSettings").Get<LoggerSettings>() ?? new LoggerSettings();

                        #endregion

                        // Initialize Serilog with custom settings
                        Logger.Initialize(loggerSettings, "Platform MS", context.HostingEnvironment);

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
                        services.AddOptions<MessageEncryptionSettings>()
                            .Bind(context.Configuration.GetSection(MessageEncryptionSettings.SectionName))
                            .Validate(s => !string.IsNullOrWhiteSpace(s.Key), "MessageEncryption:Key is required.")
                            .Validate(s =>
                            {
                                try
                                {
                                    return Convert.FromBase64String(s.Key).Length == 32;
                                }
                                catch (FormatException)
                                {
                                    return false;
                                }
                            }, "MessageEncryption:Key must be a 32-byte Base64 AES-256 key.")
                            .ValidateOnStart();
                        services.AddSingleton<IMessageContentCipher, AesGcmMessageContentCipher>();

                        services.AddDbContext<GamersCommunityDbContext>((sp, options) =>
                        {
                            var connectionString = context.Configuration.GetConnectionString("Database")
                                ?? throw new InvalidOperationException("Connection string 'Database' is missing.");
                            options.UseSqlServer(connectionString);
                        });

                        services.AddSingleton<Serilog.ILogger>(sp => Log.Logger);
                        services.AddSingleton<IRealtimeEventPublisher, RealtimeEventPublisher>();
                        services.AddScoped<Platform.Consumer.Notifications.INotificationWriter, Platform.Consumer.Notifications.NotificationWriter>();

                        services.Scan(scan => scan
                            .FromAssembliesOf(typeof(AppSettings))
                            .AddClasses(c => c.AssignableTo<IBusService>())
                            .AsImplementedInterfaces()
                            .WithScopedLifetime());
                        services.AddScoped<HealthService>();
                        services.AddScoped<BusRouter>();
                        services.AddScoped<PlatformServiceConsumer>();

                        // Register the background worker that runs the consumer
                        services.AddHostedService<ConsumerWorker>();
                    });

                var host = builder.Build();

                await ApplyDatabaseMigrationsAsync(host.Services);

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

        private static async Task ApplyDatabaseMigrationsAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<GamersCommunityDbContext>();
            await dbContext.Database.MigrateAsync();
            Log.Information("Database migrations applied.");
            var seedLogger = scope.ServiceProvider
                .GetRequiredService<Microsoft.Extensions.Logging.ILoggerFactory>()
                .CreateLogger("ReferenceDataSeed");
            await ReferenceDataSeed.EnsureAsync(dbContext, seedLogger);
        }
    }
}
