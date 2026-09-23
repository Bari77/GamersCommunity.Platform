using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data
{
    /// <summary>
    /// Seed catalog for <see cref="EventsUsersStatus"/> — not a Gateway resource ([<see cref="BusInternalAttribute"/>]).
    /// </summary>
    [BusInternal]
    public class EventsUsersStatusesService(GamersCommunityDbContext context) : GenericDataService<GamersCommunityDbContext, EventsUsersStatus>(context, "EventsUsersStatuses")
    {
    }
}
