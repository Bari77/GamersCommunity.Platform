import { Friend } from "./friend.model";

describe("Friend.fromDto", () => {
    it("maps peer identity and numeric ids", () => {
        const friend = Friend.fromDto({
            id: 11,
            publicId: "friend-11",
            idFriendAsking: 1,
            idFriendReceive: 2,
            idFriendStatus: 3,
            modificationDate: "2026-10-12T08:00:00Z",
            peerId: 2,
            peerPublicId: "peer-2",
            peerNickname: "Ada",
            peerDiscriminator: "0001",
            peerAvatarUrl: "https://cdn.example/a.png",
        });

        expect(friend.id).toBe(11);
        expect(friend.peerId).toBe(2);
        expect(friend.peerLabel).toBe("Ada#0001");
        expect(friend.modificationDate.toISOString()).toBe("2026-10-12T08:00:00.000Z");
    });
});
