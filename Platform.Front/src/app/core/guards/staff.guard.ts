import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthGuard } from "@core/guards/auth.guard";
import { PermissionsService } from "@core/services/permissions.service";
import { UsersStore } from "@features/users/stores/users.store";

export const staffGuard: CanActivateFn = async () => {
    const authGuard = inject(AuthGuard);
    const usersStore = inject(UsersStore);
    const permissions = inject(PermissionsService);
    const router = inject(Router);

    const authenticated = await new Promise<boolean>((resolve) => {
        authGuard.canActivate().subscribe((value) => resolve(value));
    });
    if (!authenticated) {
        return false;
    }

    await usersStore.ensureSession();
    await usersStore.refreshSessionFromTouch();
    if (!permissions.isStaff()) {
        void router.navigate(["/home"]);
        return false;
    }

    return true;
};
