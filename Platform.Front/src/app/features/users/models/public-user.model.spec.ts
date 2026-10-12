import { PublicUser } from "./public-user.model";

describe("PublicUser", () => {
    it("builds the display nickname and parses last connection", () => {
        const user = PublicUser.fromDto({
            id: 3,
            publicId: "pub-3",
            nickname: "Ada",
            discriminator: "0001",
            avatarUrl: "",
            lastConnection: "2026-10-12T10:00:00",
        });

        expect(user.fullNickname).toBe("Ada#0001");
        expect(user.lastConnection?.toISOString()).toBe("2026-10-12T10:00:00.000Z");
    });

    it("keeps a null last connection when absent", () => {
        const user = PublicUser.fromDto({
            id: 3,
            publicId: "pub-3",
            nickname: "Ada",
            discriminator: "0001",
            avatarUrl: "",
            lastConnection: null,
        });

        expect(user.lastConnection).toBeNull();
    });
});
