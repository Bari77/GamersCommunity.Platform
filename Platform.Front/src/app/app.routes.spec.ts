import { gameAvailableGuard } from "@core/guards/game-available.guard";
import { appRoutes } from "./app.routes";

describe("appRoutes", () => {
    function route(path: string) {
        return appRoutes.find((entry) => entry.path === path);
    }

    it("keeps the shell entry points", () => {
        expect(route("")?.redirectTo).toBe("/home");
        expect(route("home")).toBeTruthy();
        expect(route("auth")?.loadChildren).toBeTruthy();
        expect(route("users")?.loadChildren).toBeTruthy();
        expect(route("social")?.loadChildren).toBeTruthy();
        expect(route("events")?.loadChildren).toBeTruthy();
        expect(route("moderation")?.loadChildren).toBeTruthy();
        expect(route("offline")?.loadComponent).toBeTruthy();
        expect(route("**")?.redirectTo).toBe("/home");
    });

    it("gates game remotes behind availability", () => {
        for (const path of ["world-of-warcraft", "league-of-legends"]) {
            const game = route(path);
            expect(game?.canActivate).toEqual([gameAvailableGuard]);
            expect(game?.loadChildren).toBeTruthy();
        }
    });
});
