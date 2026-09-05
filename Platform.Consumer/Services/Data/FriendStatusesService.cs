using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data
{
    /// <summary>
    /// Specialized table service for handling <see cref="FriendStatus"/> entities.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This service inherits from <see cref="GenericDataService{TContext, TEntity}"/>,
    /// binding it to the <see cref="GamersCommunityDbContext"/> database context and the <see cref="FriendStatus"/> entity type.
    /// </para>
    /// <para>
    /// It exposes all generic CRUD operations (List, Get, Update, Delete, etc.) implemented
    /// in <see cref="GenericDataService{TContext, TEntity}"/>, while associating them with the logical table name <c>"FriendStatuses"</c>.
    /// </para>
    /// </remarks>
    /// <param name="context">
    /// The database context used to access the <c>FriendStatuses</c> table.
    /// Typically injected by dependency injection.
    /// </param>
    public class FriendStatusesService(GamersCommunityDbContext context) : GenericDataService<GamersCommunityDbContext, FriendStatus>(context, "FriendStatuses")
    {
    }
}
