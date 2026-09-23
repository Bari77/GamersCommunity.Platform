using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data
{
    /// <summary>
    /// Seed / FK catalog for <see cref="City"/> — not a Gateway resource ([<see cref="BusInternalAttribute"/>]).
    /// </summary>
    [BusInternal]
    public class CitiesService(GamersCommunityDbContext context) : GenericDataService<GamersCommunityDbContext, City>(context, "Cities")
    {
    }
}
