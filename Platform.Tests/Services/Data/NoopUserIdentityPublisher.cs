using Platform.Consumer.Integration;
using Platform.Database.Models;

namespace Platform.Tests.Services.Data;

internal sealed class NoopUserIdentityPublisher : IUserIdentityPublisher
{
    public Task PublishAsync(User user, CancellationToken ct = default) => Task.CompletedTask;
}
