import { isUserOnline, PRESENCE_ONLINE_MS } from "./presence.util";

describe("isUserOnline", () => {
    const now = Date.parse("2026-10-12T12:00:00.000Z");

    it("returns false when lastConnection is missing", () => {
        expect(isUserOnline(null, now)).toBeFalse();
        expect(isUserOnline(undefined, now)).toBeFalse();
    });

    it("returns true when the user connected within the presence window", () => {
        const recent = new Date(now - PRESENCE_ONLINE_MS + 1_000);
        expect(isUserOnline(recent, now)).toBeTrue();
    });

    it("returns false when the presence window has elapsed", () => {
        const stale = new Date(now - PRESENCE_ONLINE_MS - 1_000);
        expect(isUserOnline(stale, now)).toBeFalse();
    });

    it("parses UTC strings without treating them as local time", () => {
        expect(isUserOnline("2026-10-12T11:59:00", now)).toBeTrue();
    });
});
