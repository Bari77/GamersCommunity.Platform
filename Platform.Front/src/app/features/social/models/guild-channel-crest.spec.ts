import { parseGuildChannelCrest } from "./guild-channel-crest";

describe("parseGuildChannelCrest", () => {
    const valid = "wow-crest:v1|https://assets.example.test|Alliance|12|#aabbcc|3|#112233|#445566";

    it("returns null for unrelated picture URLs", () => {
        expect(parseGuildChannelCrest("https://cdn.example/crest.png")).toBeNull();
        expect(parseGuildChannelCrest(null)).toBeNull();
    });

    it("parses a valid crest token", () => {
        expect(parseGuildChannelCrest(valid)).toEqual({
            assetsOrigin: "https://assets.example.test",
            faction: "alliance",
            emblem: 12,
            emblemColor: "#aabbcc",
            border: 3,
            borderColor: "#112233",
            backgroundColor: "#445566",
        });
    });

    it("rejects malformed tokens", () => {
        expect(parseGuildChannelCrest("wow-crest:v1|ftp://bad|Alliance|1|#ffffff|0|#ffffff|#ffffff")).toBeNull();
        expect(parseGuildChannelCrest("wow-crest:v1|https://a|Horde|x|#ffffff|0|#ffffff|#ffffff")).toBeNull();
    });
});
