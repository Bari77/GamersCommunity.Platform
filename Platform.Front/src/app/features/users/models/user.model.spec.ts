import { User } from "./user.model";

describe("User.fromDto", () => {
    it("maps session fields and optional mute", () => {
        const user = User.fromDto({
            id: 7,
            publicId: "pub-7",
            nickname: "Bari",
            discriminator: "0042",
            avatarUrl: "https://cdn.example/a.png",
            mail: "bari@example.test",
            lastConnection: "2026-10-12T12:00:00",
            idKeycloak: "kc-7",
            siteRoles: ["admin"],
            gameRoles: [{ gameUrlValue: "/world-of-warcraft", code: "moderator" }],
            activeMute: { reason: "spam", endDate: "2026-10-13T00:00:00Z" },
        });

        expect(user.id).toBe(7);
        expect(user.siteRoles).toEqual(["admin"]);
        expect(user.gameRoles).toEqual([{ gameUrlValue: "/world-of-warcraft", code: "moderator" }]);
        expect(user.activeMute?.reason).toBe("spam");
        expect(user.activeMute?.endDate.toISOString()).toBe("2026-10-13T00:00:00.000Z");
        expect(user.lastConnection.toISOString()).toBe("2026-10-12T12:00:00.000Z");
    });

    it("defaults roles and mute when omitted", () => {
        const user = User.fromDto({
            id: 1,
            publicId: "pub-1",
            nickname: "Ada",
            discriminator: "0001",
            avatarUrl: "",
            mail: "ada@example.test",
            lastConnection: "2026-01-01T00:00:00Z",
            idKeycloak: "kc-1",
        });

        expect(user.siteRoles).toEqual([]);
        expect(user.gameRoles).toEqual([]);
        expect(user.activeMute).toBeNull();
    });
});
