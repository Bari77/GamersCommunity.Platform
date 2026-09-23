using GamersCommunity.Core.Events;
using GamersCommunity.Core.Hosting;
using GamersCommunity.Core.Logging;
using GamersCommunity.Core.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Platform.Consumer.Configuration;
using Platform.Consumer.Integration;
using Platform.Consumer.Security;
using Platform.Consumer.Services.Infra;
using Platform.Database.Context;
using Platform.Database.Seed;
using Serilog;

namespace Platform.Consumer;

public class Program
{
    public static Task Main(string[] args) =>
        GamersCommunityConsumerHost.RunAsync<GamersCommunityDbContext, PlatformServiceConsumer>(
            args,
            consoleTitle: "Platform MicroService",
            configureLogging: (context, logging) =>
            {
                var loggerSettings = context.Configuration.GetSection("LoggerSettings").Get<LoggerSettings>() ?? new LoggerSettings();
                Logger.Initialize(loggerSettings, "Platform MS", context.HostingEnvironment);
                logging.ClearProviders();
                Log.Information("Starting ...");
            },
            configureServices: (context, services) =>
            {
                services.AddOptions<AppSettings>().Bind(context.Configuration.GetSection("AppSettings")).ValidateOnStart();
                services.AddOptions<AuthZSettings>().Bind(context.Configuration.GetSection(AuthZSettings.SectionName));
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
                services.AddRealtimeEventPublisher();
                services.AddSingleton<IIntegrationEventPublisher, RabbitIntegrationEventPublisher>();
                services.AddSingleton<IUserIdentityPublisher, UserIdentityPublisher>();
                services.AddScoped<Platform.Consumer.Notifications.INotificationWriter, Platform.Consumer.Notifications.NotificationWriter>();
                services.Scan(scan => scan
                    .FromAssembliesOf(typeof(AppSettings))
                    .AddClasses(c => c.AssignableTo<IBusService>())
                    .AsImplementedInterfaces()
                    .WithScopedLifetime());
                services.AddScoped<HealthService>();
            },
            afterMigrate: async (db, sp, _) =>
            {
                var seedLogger = sp.GetRequiredService<ILoggerFactory>().CreateLogger("ReferenceDataSeed");
                await ReferenceDataSeed.EnsureAsync(db, seedLogger);
            });
}
