import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { GameAvailabilityService } from "@features/games/services/game-availability.service";
import { NbToastrService } from "@nebular/theme";
import { firstValueFrom } from "rxjs";

export const gameAvailableGuard: CanActivateFn = async (route) => {
    const availability = inject(GameAvailabilityService);
    const router = inject(Router);
    const toastr = inject(NbToastrService);
    const slug = route.routeConfig?.path;

    if (!slug) {
        return true;
    }

    const statuses = await firstValueFrom(availability.list());
    if (GameAvailabilityService.isAvailable(statuses, `/${slug}`)) {
        return true;
    }

    toastr.danger(
        $localize`:@@core.federation.loadError:Could not load this game.`,
        $localize`:@@core.federation.loadErrorTitle:Game unavailable`,
        { duration: 8_000 },
    );

    return router.parseUrl("/home");
};
