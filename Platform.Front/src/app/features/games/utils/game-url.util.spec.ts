import { toGameApiSegment, toGameRootPath } from "./game-url.util";

describe("game-url utils", () => {
    it("strips slashes and hyphens for the Gateway API segment", () => {
        expect(toGameApiSegment("/world-of-warcraft/")).toBe("worldofwarcraft");
        expect(toGameApiSegment("league-of-legends")).toBe("leagueoflegends");
    });

    it("normalizes the front route root with a leading slash", () => {
        expect(toGameRootPath("world-of-warcraft")).toBe("/world-of-warcraft");
        expect(toGameRootPath("/league-of-legends/")).toBe("/league-of-legends");
    });
});
