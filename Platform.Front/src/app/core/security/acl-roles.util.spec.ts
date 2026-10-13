import { gameAclSuffix, toAclRoles } from "./acl-roles.util";

describe("gameAclSuffix", () => {
    it("maps known game paths to short ACL suffixes", () => {
        expect(gameAclSuffix("/world-of-warcraft")).toBe("wow");
        expect(gameAclSuffix("league-of-legends")).toBe("lol");
    });

    it("falls back to a slug for unknown games", () => {
        expect(gameAclSuffix("/some-new-game")).toBe("some_new_game");
    });
});

describe("toAclRoles", () => {
    it("always includes the base user role", () => {
        expect(toAclRoles([], [])).toEqual(["user"]);
    });

    it("expands site admin into admin + moderator", () => {
        expect(toAclRoles(["Admin"], [])).toEqual(jasmine.arrayContaining(["user", "admin", "moderator"]));
    });

    it("maps game moderator codes onto per-game ACL roles", () => {
        const roles = toAclRoles([], [{ gameUrlValue: "/world-of-warcraft", code: "moderator" }]);
        expect(roles).toContain("moderator_wow");
        expect(roles).not.toContain("admin_wow");
    });

    it("expands game admin into admin + moderator for that game", () => {
        const roles = toAclRoles([], [{ gameUrlValue: "/league-of-legends", code: "admin" }]);
        expect(roles).toEqual(jasmine.arrayContaining(["admin_lol", "moderator_lol"]));
    });
});
