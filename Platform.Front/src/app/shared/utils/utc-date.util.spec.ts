import { parseUtcDate, parseUtcDateOrNull } from "./utc-date.util";

describe("parseUtcDate", () => {
    it("returns Date instances unchanged", () => {
        const value = new Date("2026-10-12T10:00:00.000Z");
        expect(parseUtcDate(value)).toBe(value);
    });

    it("treats date-only strings as UTC midnight", () => {
        expect(parseUtcDate("2026-10-12").toISOString()).toBe("2026-10-12T00:00:00.000Z");
    });

    it("appends Z when a timestamp has no timezone", () => {
        expect(parseUtcDate("2026-10-12T15:30:00").toISOString()).toBe("2026-10-12T15:30:00.000Z");
    });

    it("keeps explicit timezone offsets", () => {
        expect(parseUtcDate("2026-10-12T15:30:00+02:00").toISOString()).toBe("2026-10-12T13:30:00.000Z");
    });
});

describe("parseUtcDateOrNull", () => {
    it("returns null for empty values", () => {
        expect(parseUtcDateOrNull(null)).toBeNull();
        expect(parseUtcDateOrNull("")).toBeNull();
    });

    it("returns null for invalid strings", () => {
        expect(parseUtcDateOrNull("not-a-date")).toBeNull();
    });
});
