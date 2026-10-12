import { AppNotification } from "../models/notification.model";
import { NotificationKinds } from "../models/notification-kinds";
import {
    localizeNotificationBody,
    localizeNotificationTitle,
    notificationPeerLabel,
    parseNotificationPayload,
} from "./notification-copy.util";

function notification(partial: Partial<AppNotification> & Pick<AppNotification, "title">): AppNotification {
    return new AppNotification(
        1,
        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        42,
        NotificationKinds.FriendRequest,
        partial.title,
        partial.body ?? null,
        partial.linkUrl ?? null,
        partial.isRead ?? false,
        partial.payloadJson ?? null,
        partial.creationDate ?? new Date("2026-10-12T12:00:00.000Z"),
    );
}

describe("notification-copy utils", () => {
    it("parses JSON payloads and ignores invalid JSON", () => {
        expect(parseNotificationPayload('{"peerId":7}')).toEqual({ peerId: 7 });
        expect(parseNotificationPayload("{nope}")).toEqual({});
        expect(parseNotificationPayload(null)).toEqual({});
    });

    it("formats peer labels with nickname and discriminator", () => {
        expect(notificationPeerLabel({ peerNickname: "Bari", peerDiscriminator: "0042" })).toBe("Bari#0042");
        expect(notificationPeerLabel({ peerId: 9 })).toBe("#9");
    });

    it("localizes known notification titles", () => {
        expect(localizeNotificationTitle(notification({ title: "notifications.friendRequest.title" }))).toContain(
            "Friend request",
        );
        expect(localizeNotificationTitle(notification({ title: "Custom title" }))).toBe("Custom title");
    });

    it("localizes friend-request bodies with the peer name", () => {
        const body = localizeNotificationBody(
            notification({
                title: "notifications.friendRequest.title",
                body: "notifications.friendRequest.body",
                payloadJson: JSON.stringify({ peerNickname: "Ada", peerDiscriminator: "0001" }),
            }),
        );
        expect(body).toContain("Ada#0001");
    });
});
