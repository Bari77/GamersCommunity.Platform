import { staffGuard } from "@core/guards/staff.guard";
import { moderationRoutes } from "./moderation.routes";

describe("moderationRoutes", () => {
    it("requires staff access on the moderation area", () => {
        expect(moderationRoutes[0]?.canActivate).toEqual([staffGuard]);
        const children = moderationRoutes[0]?.children ?? [];
        expect(children.some((child) => child.path === "users")).toBeTrue();
        expect(children.some((child) => child.path === "reports")).toBeTrue();
    });
});
