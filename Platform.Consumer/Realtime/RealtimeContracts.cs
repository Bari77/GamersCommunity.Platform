namespace Platform.Consumer.Realtime;

public static class RealtimeQueues
{
    public const string Gateway = "gateway_realtime_queue";
}

public static class RealtimeEventTypes
{
    public const string MessageCreated = "message.created";
    public const string ConversationUpdated = "conversation.updated";
    public const string FriendUpdated = "friend.updated";
    public const string NotificationCreated = "notification.created";
    public const string PresenceChanged = "presence.changed";
    public const string ReportQueueUpdated = "report.queue.updated";
}
