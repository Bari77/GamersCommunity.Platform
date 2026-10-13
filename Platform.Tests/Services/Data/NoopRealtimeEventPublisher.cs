using GamersCommunity.Core.Realtime;

namespace Platform.Tests.Services.Data;

internal sealed class NoopRealtimeEventPublisher : IRealtimeEventPublisher
{
    public Task PublishAsync<T>(T payload, CancellationToken ct = default) => Task.CompletedTask;
}
