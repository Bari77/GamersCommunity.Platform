using GamersCommunity.Core.Services;
using Platform.Database.Context;
using Platform.Database.Models;

namespace Platform.Consumer.Services.Data;

public class PostsService(GamersCommunityDbContext context)
    : GenericDataService<GamersCommunityDbContext, Post>(context, "Posts")
{
}
