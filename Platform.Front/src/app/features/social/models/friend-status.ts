export const FriendStatusId = {
    Pending: 1,
    Accepted: 2,
    Refused: 3,
    Blocked: 4,
} as const;

export type FriendStatusIdValue = (typeof FriendStatusId)[keyof typeof FriendStatusId];
