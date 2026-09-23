import { loadRemoteModule } from "@angular-architects/native-federation-v4";
import { inject } from "@angular/core";
import { Router, Routes } from "@angular/router";
import { NbToastrService } from "@nebular/theme";

export async function loadRemoteRoutes(
    remoteName: string,
    exposedModule: string,
    exportName: string,
): Promise<Routes> {
    const toastr = inject(NbToastrService);
    const router = inject(Router);

    try {
        const remote = (await loadRemoteModule(remoteName, exposedModule)) as Record<string, unknown>;
        const routes = remote[exportName];
        if (!Array.isArray(routes)) {
            throw new Error(`Remote "${remoteName}" did not export routes as "${exportName}".`);
        }
        return routes as Routes;
    } catch (error) {
        console.error(`[federation] Failed to load remote "${remoteName}"`, error);
        toastr.danger(
            $localize`:@@core.federation.loadError:Could not load this game.`,
            $localize`:@@core.federation.loadErrorTitle:Game unavailable`,
            { duration: 8_000 },
        );
        void router.navigateByUrl("/home");
        return [{ path: "", pathMatch: "full", redirectTo: "/home" }];
    }
}
