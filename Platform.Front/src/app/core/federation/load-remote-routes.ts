import { loadRemoteModule } from "@angular-architects/native-federation-v4";
import { inject } from "@angular/core";
import { LoadingStore } from "@core/stores/loading.store";

const loadedRemotes = new Set<string>();

export async function loadRemoteRoutes<T>(
    remoteName: string,
    exposedModule: string,
    pick: (remote: Record<string, unknown>) => T,
): Promise<T> {
    const loadingStore = inject(LoadingStore);
    const showLoader = !loadedRemotes.has(remoteName);

    if (showLoader) {
        loadingStore.show($localize`:@@core.layout.loading.game:Loading game…`);
    }

    try {
        const remote = await loadRemoteModule(remoteName, exposedModule);
        loadedRemotes.add(remoteName);
        return pick(remote);
    } finally {
        if (showLoader) {
            loadingStore.hide();
        }
    }
}
