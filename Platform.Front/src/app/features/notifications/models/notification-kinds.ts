export const NotificationKinds = {
    FriendRequest: "friend_request",
    FriendAccepted: "friend_accepted",
    Message: "message",
    EventRsvp: "event_rsvp",
    ContentApproval: "content_approval",
    GuildRequest: "guild_request",
    Lfg: "lfg",
    Sanction: "sanction",
} as const;

export type NotificationKind = (typeof NotificationKinds)[keyof typeof NotificationKinds] | string;
