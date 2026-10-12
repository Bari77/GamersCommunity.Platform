import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { NbAuthService } from "@nebular/auth";
import { firstValueFrom, of } from "rxjs";
import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
    let guard: AuthGuard;
    let navigate: jasmine.Spy;

    beforeEach(() => {
        navigate = jasmine.createSpy("navigate");
        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                { provide: NbAuthService, useValue: { isAuthenticated: () => of(false) } },
                { provide: Router, useValue: { navigate } },
            ],
        });
        guard = TestBed.inject(AuthGuard);
    });

    it("blocks anonymous visitors and sends them to login", async () => {
        await expectAsync(firstValueFrom(guard.canActivate())).toBeResolvedTo(false);
        expect(navigate).toHaveBeenCalledWith(["/users/login"]);
    });

    it("allows authenticated visitors", async () => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                AuthGuard,
                { provide: NbAuthService, useValue: { isAuthenticated: () => of(true) } },
                { provide: Router, useValue: { navigate } },
            ],
        });
        guard = TestBed.inject(AuthGuard);

        await expectAsync(firstValueFrom(guard.canActivate())).toBeResolvedTo(true);
        expect(navigate).not.toHaveBeenCalled();
    });
});
