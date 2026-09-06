import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { LoadingStore } from "@core/stores/loading.store";
import { ReportsStore } from "../../stores/reports.store";

export const staffReportsResolver: ResolveFn<void> = async () => {
    const loadingStore = inject(LoadingStore);
    const store = inject(ReportsStore);
    loadingStore.loading.set(true);
    try {
        await store.reload();
        await store.loaded();
    } finally {
        loadingStore.loading.set(false);
    }
};
