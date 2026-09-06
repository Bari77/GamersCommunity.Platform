export const EventRsvpStatusId = {
    Interested: 1,
    Going: 2,
    Declined: 3,
} as const;

export type EventRsvpStatusIdValue = (typeof EventRsvpStatusId)[keyof typeof EventRsvpStatusId];
