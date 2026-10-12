import { Conversation } from "./conversation.model";

describe("Conversation", () => {
    it("normalizes unknown kinds to dm and exposes group/lock rules", () => {
        const dm = Conversation.fromDto({
            publicId: "c-dm",
            kind: "unexpected",
            displayTitle: "Ada",
            isOwner: true,
            creationDate: "2026-10-12T00:00:00Z",
        });
        expect(dm.kind).toBe("dm");
        expect(dm.isGroup).toBeFalse();
        expect(dm.membershipLocked).toBeFalse();

        const guild = Conversation.fromDto({
            publicId: "c-guild",
            kind: "guild",
            displayTitle: "Raid",
            isOwner: false,
            creationDate: "2026-10-12T00:00:00Z",
            pictureUrl: "wow-crest:v1|https://assets.example.test|Horde|1|#ffffff|0|#ffffff|#000000",
        });
        expect(guild.isGroup).toBeTrue();
        expect(guild.membershipLocked).toBeTrue();
        expect(guild.guildCrest?.faction).toBe("horde");
    });

    it("updates unread and preview without mutating identity", () => {
        const base = Conversation.fromDto({
            publicId: "c-1",
            kind: "dm",
            displayTitle: "Ada",
            isOwner: true,
            creationDate: "2026-10-12T00:00:00Z",
            unreadCount: 0,
        });
        const next = base.withUnreadCount(2).withPreview("hi", new Date("2026-10-12T01:00:00Z"));
        expect(next.publicId).toBe("c-1");
        expect(next.unreadCount).toBe(2);
        expect(next.lastMessage).toBe("hi");
        expect(base.unreadCount).toBe(0);
    });
});
