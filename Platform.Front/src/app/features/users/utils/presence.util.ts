/** Soft presence: activity within this window counts as online. */
export const PRESENCE_ONLINE_MS = 3 * 60 * 1000;

export function isUserOnline(lastConnection: Date | string | null | undefined, now = Date.now()): boolean {
    if (!lastConnection) {
        return false;
    }
    const ts = lastConnection instanceof Date ? lastConnection.getTime() : new Date(lastConnection).getTime();
    if (Number.isNaN(ts)) {
        return false;
    }
    return now - ts <= PRESENCE_ONLINE_MS;
}
