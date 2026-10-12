import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { environment } from "environments/environment";
import { GameAvailabilityService } from "./game-availability.service";

describe("GameAvailabilityService", () => {
    let service: GameAvailabilityService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(GameAvailabilityService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it("treats missing status as available", () => {
        expect(GameAvailabilityService.isAvailable(new Map(), "/world-of-warcraft")).toBeTrue();
    });

    it("maps gateway availability items by API segment", () => {
        let statuses: Map<string, boolean> | undefined;
        service.list().subscribe((value) => (statuses = value));

        const req = http.expectOne(`${environment.apiUrl}/gateway/availability`);
        req.flush({
            items: [
                { id: "worldofwarcraft", available: false },
                { id: "LeagueOfLegends", available: true },
            ],
        });

        expect(statuses?.get("worldofwarcraft")).toBeFalse();
        expect(statuses?.get("leagueoflegends")).toBeTrue();
        expect(GameAvailabilityService.isAvailable(statuses!, "/world-of-warcraft")).toBeFalse();
    });

    it("returns an empty map when the gateway call fails", () => {
        let statuses: Map<string, boolean> | undefined;
        service.list().subscribe((value) => (statuses = value));

        http.expectOne(`${environment.apiUrl}/gateway/availability`).flush("down", {
            status: 503,
            statusText: "Service Unavailable",
        });

        expect(statuses?.size).toBe(0);
    });
});
