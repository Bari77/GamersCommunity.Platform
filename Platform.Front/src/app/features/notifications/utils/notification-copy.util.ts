import { AppNotification } from "../models/notification.model";

export interface NotificationPayload {
    peerId?: number;
    peerNickname?: string;
    peerDiscriminator?: string;
    preview?: string;
    friendshipPublicId?: string;
    messagePublicId?: string;
    kind?: string;
    entitled?: string;
    endDate?: string;
}

export function parseNotificationPayload(payloadJson: string | null): NotificationPayload {
    if (!payloadJson) {
        return {};
    }
    try {
        return JSON.parse(payloadJson) as NotificationPayload;
    } catch {
        return {};
    }
}

export function notificationPeerLabel(payload: NotificationPayload): string {
    const nick = payload.peerNickname?.trim();
    if (!nick) {
        return payload.peerId ? `#${payload.peerId}` : "";
    }
    const disc = payload.peerDiscriminator?.trim();
    return disc ? `${nick}#${disc}` : nick;
}

export function localizeNotificationTitle(item: AppNotification): string {
    switch (item.title) {
        case "notifications.friendRequest.title":
            return $localize`:@@notifications.friendRequest.title:Friend request`;
        case "notifications.friendAccepted.title":
            return $localize`:@@notifications.friendAccepted.title:Friend request accepted`;
        case "notifications.sanction.mute.title":
            return $localize`:@@notifications.sanction.mute.title:You were muted`;
        default:
            return item.title;
    }
}

export function localizeNotificationBody(item: AppNotification): string | null {
    if (!item.body) {
        return null;
    }

    const payload = parseNotificationPayload(item.payloadJson);
    const name = notificationPeerLabel(payload);

    switch (item.body) {
        case "notifications.friendRequest.body":
            return $localize`:@@notifications.friendRequest.body:${name}:name: wants to add you`;
        case "notifications.friendAccepted.body":
            return $localize`:@@notifications.friendAccepted.body:${name}:name: accepted your request`;
        case "notifications.sanction.mute.body": {
            const reason = payload.entitled?.trim() || item.body;
            return $localize`:@@notifications.sanction.mute.body:A moderator muted you: ${reason}:reason:`;
        }
        default:
            return item.body;
    }
}
