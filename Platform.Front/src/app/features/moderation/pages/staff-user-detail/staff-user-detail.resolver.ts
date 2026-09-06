import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { LoadingStore } from "@core/stores/loading.store";
import { StaffUserDetailStore } from "../../stores/staff-user-detail.store";

export const staffUserDetailResolver: ResolveFn<void> = async (route) => {
    const loadingStore = inject(LoadingStore);
    const store = inject(StaffUserDetailStore);
    const publicId = route.paramMap.get("publicId");
    if (!publicId) {
        return;
    }
    loadingStore.loading.set(true);
    try {
        await store.load(publicId);
        await store.loaded();
    } finally {
        loadingStore.loading.set(false);
    }
};
