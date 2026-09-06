import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { LoadingStore } from "@core/stores/loading.store";
import { StaffUsersStore } from "../../stores/staff-users.store";

export const staffUsersResolver: ResolveFn<void> = async () => {
    const loadingStore = inject(LoadingStore);
    const store = inject(StaffUsersStore);
    loadingStore.loading.set(true);
    try {
        await store.reload();
        await store.loaded();
    } finally {
        loadingStore.loading.set(false);
    }
};
