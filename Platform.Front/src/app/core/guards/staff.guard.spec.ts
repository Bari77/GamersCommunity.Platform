import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { AuthGuard } from "@core/guards/auth.guard";
import { PermissionsService } from "@core/services/permissions.service";
import { UsersStore } from "@features/users/stores/users.store";
import { of, Observable } from "rxjs";
import { staffGuard } from "./staff.guard";

describe("staffGuard", () => {
    let navigate: jasmine.Spy;

    function setup(options: { authenticated: boolean; staff: boolean }): void {
        navigate = jasmine.createSpy("navigate");
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthGuard,
                    useValue: { canActivate: (): Observable<boolean> => of(options.authenticated) },
                },
                {
                    provide: UsersStore,
                    useValue: {
                        ensureSession: jasmine.createSpy("ensureSession").and.resolveTo(undefined),
                        refreshSessionFromTouch: jasmine.createSpy("refreshSessionFromTouch").and.resolveTo(undefined),
                    },
                },
                { provide: PermissionsService, useValue: { isStaff: (): boolean => options.staff } },
                { provide: Router, useValue: { navigate } },
            ],
        });
    }

    it("rejects unauthenticated visitors", async () => {
        setup({ authenticated: false, staff: true });
        const allowed = await TestBed.runInInjectionContext(() => staffGuard({} as never, {} as never));
        expect(allowed).toBeFalse();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("redirects authenticated non-staff users home", async () => {
        setup({ authenticated: true, staff: false });
        const allowed = await TestBed.runInInjectionContext(() => staffGuard({} as never, {} as never));
        expect(allowed).toBeFalse();
        expect(navigate).toHaveBeenCalledWith(["/home"]);
    });

    it("allows staff", async () => {
        setup({ authenticated: true, staff: true });
        const allowed = await TestBed.runInInjectionContext(() => staffGuard({} as never, {} as never));
        expect(allowed).toBeTrue();
    });
});
