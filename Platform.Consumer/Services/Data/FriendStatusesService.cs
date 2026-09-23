using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data
{
    /// <summary>
    /// Seed catalog for <see cref="FriendStatus"/> — Front uses fixed ids; not a Gateway resource ([<see cref="BusInternalAttribute"/>]).
    /// </summary>
    [BusInternal]
    public class FriendStatusesService(GamersCommunityDbContext context) : GenericDataService<GamersCommunityDbContext, FriendStatus>(context, "FriendStatuses")
    {
    }
}
