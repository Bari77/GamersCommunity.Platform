using GamersCommunity.Core.Rabbit;
using GamersCommunity.Core.Services;
using Platform.Consumer.Security;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data;

public class PostsService(GamersCommunityDbContext context)
    : GenericDataService<GamersCommunityDbContext, Post>(context, "Posts")
{
    public override async Task<string> HandleAsync(BusMessage message, CancellationToken ct = default)
    {
        if (message.Action.Equals("Create", StringComparison.OrdinalIgnoreCase)
            || message.Action.Equals("Update", StringComparison.OrdinalIgnoreCase)
            || message.Action.Equals("Delete", StringComparison.OrdinalIgnoreCase))
        {
            var caller = await CallerAuth.RequireUserAsync(Context, message, ct);
            await CallerAuth.EnsureNotBannedAsync(Context, caller.Id, ct);
        }

        return await base.HandleAsync(message, ct);
    }
}
