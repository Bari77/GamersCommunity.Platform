import { TestBed } from "@angular/core/testing";
import { ActivatedRouteSnapshot, Router, UrlTree } from "@angular/router";
import { GameAvailabilityService } from "@features/games/services/game-availability.service";
import { NbToastrService } from "@nebular/theme";
import { of } from "rxjs";
import { gameAvailableGuard } from "./game-available.guard";

describe("gameAvailableGuard", () => {
    let danger: jasmine.Spy;
    let parseUrl: jasmine.Spy;
    let list: jasmine.Spy;

    beforeEach(() => {
        danger = jasmine.createSpy("danger");
        parseUrl = jasmine.createSpy("parseUrl").and.returnValue({} as UrlTree);
        list = jasmine.createSpy("list");

        TestBed.configureTestingModule({
            providers: [
                { provide: GameAvailabilityService, useValue: { list } },
                { provide: Router, useValue: { parseUrl } },
                { provide: NbToastrService, useValue: { danger } },
            ],
        });
    });

    function route(path: string | undefined): ActivatedRouteSnapshot {
        return { routeConfig: path === undefined ? null : { path } } as ActivatedRouteSnapshot;
    }

    it("allows routes without a path segment", async () => {
        const result = await TestBed.runInInjectionContext(() => gameAvailableGuard(route(undefined), {} as never));
        expect(result).toBeTrue();
        expect(list).not.toHaveBeenCalled();
    });

    it("allows an available game remote", async () => {
        list.and.returnValue(of(new Map([["worldofwarcraft", true]])));
        const result = await TestBed.runInInjectionContext(() =>
            gameAvailableGuard(route("world-of-warcraft"), {} as never),
        );
        expect(result).toBeTrue();
        expect(danger).not.toHaveBeenCalled();
    });

    it("blocks unavailable games and toast + redirect home", async () => {
        list.and.returnValue(of(new Map([["worldofwarcraft", false]])));
        const result = await TestBed.runInInjectionContext(() =>
            gameAvailableGuard(route("world-of-warcraft"), {} as never),
        );
        expect(result).toEqual({} as UrlTree);
        expect(danger).toHaveBeenCalled();
        expect(parseUrl).toHaveBeenCalledWith("/home");
    });
});
