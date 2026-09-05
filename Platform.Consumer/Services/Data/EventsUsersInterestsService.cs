using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data
{
    /// <summary>
    /// Specialized table service for handling <see cref="EventsUsersInterest"/> entities.
    /// </summary>
    /// <remarks>
    /// <para>
    /// This service inherits from <see cref="GenericDataService{TContext, TEntity}"/>,
    /// binding it to the <see cref="GamersCommunityDbContext"/> database context and the <see cref="EventsUsersInterest"/> entity type.
    /// </para>
    /// <para>
    /// It exposes all generic CRUD operations (List, Get, Update, Delete, etc.) implemented
    /// in <see cref="GenericDataService{TContext, TEntity}"/>, while associating them with the logical table name <c>"EventsUsersInterests"</c>.
    /// </para>
    /// </remarks>
    /// <param name="context">
    /// The database context used to access the <c>EventsUsersInterests</c> table.
    /// Typically injected by dependency injection.
    /// </param>
    public class EventsUsersInterestsService(GamersCommunityDbContext context) : GenericDataService<GamersCommunityDbContext, EventsUsersInterest>(context, "EventsUsersInterests")
    {
    }
}
