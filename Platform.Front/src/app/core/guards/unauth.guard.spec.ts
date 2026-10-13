import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { UsersStore } from "@features/users/stores/users.store";
import { NbAuthService } from "@nebular/auth";
import { firstValueFrom, of, Observable } from "rxjs";
import { UnauthGuard } from "./unauth.guard";

describe("UnauthGuard", () => {
    let navigate: jasmine.Spy;
    let logout: jasmine.Spy;

    beforeEach(() => {
        navigate = jasmine.createSpy("navigate");
        logout = jasmine.createSpy("logout").and.returnValue(of(true));
    });

    function setup(authenticated: boolean, loggedIn: boolean): UnauthGuard {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                UnauthGuard,
                {
                    provide: NbAuthService,
                    useValue: {
                        isAuthenticated: (): Observable<boolean> => of(authenticated),
                        logout,
                    },
                },
                { provide: UsersStore, useValue: { isLoggedIn: (): boolean => loggedIn } },
                { provide: Router, useValue: { navigate } },
            ],
        });
        return TestBed.inject(UnauthGuard);
    }

    it("lets anonymous visitors reach login/register", async () => {
        const guard = setup(false, false);
        await expectAsync(firstValueFrom(guard.canActivate())).toBeResolvedTo(true);
        expect(navigate).not.toHaveBeenCalled();
        expect(logout).not.toHaveBeenCalled();
    });

    it("redirects an active session away from auth pages", async () => {
        const guard = setup(true, true);
        await expectAsync(firstValueFrom(guard.canActivate())).toBeResolvedTo(false);
        expect(navigate).toHaveBeenCalledWith(["/home"]);
    });

    it("clears a stale token when the session store is empty", async () => {
        const guard = setup(true, false);
        await expectAsync(firstValueFrom(guard.canActivate())).toBeResolvedTo(true);
        expect(logout).toHaveBeenCalledWith("authentik");
    });
});
