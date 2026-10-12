import { NotificationKinds } from "./notification-kinds";
import { AppNotification } from "./notification.model";

describe("AppNotification", () => {
    it("maps DTO fields and toggles read state immutably", () => {
        const item = AppNotification.fromDto({
            id: 9,
            publicId: "n-9",
            idUser: 1,
            kind: NotificationKinds.FriendRequest,
            title: "notifications.friendRequest.title",
            body: "notifications.friendRequest.body",
            linkUrl: "/social/friends",
            isRead: false,
            payloadJson: '{"peerId":2}',
            creationDate: "2026-10-12T12:00:00Z",
        });

        expect(item.kind).toBe(NotificationKinds.FriendRequest);
        expect(item.isRead).toBeFalse();
        expect(item.creationDate.toISOString()).toBe("2026-10-12T12:00:00.000Z");

        const read = item.withRead();
        expect(read.isRead).toBeTrue();
        expect(item.isRead).toBeFalse();
        expect(read.publicId).toBe(item.publicId);
    });
});
