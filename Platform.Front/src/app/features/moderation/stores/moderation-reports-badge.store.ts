import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { firstValueFrom } from "rxjs";
import { ReportsService } from "../services/reports.service";

@Injectable({ providedIn: "root" })
export class ModerationReportsBadgeStore {
    public readonly openCount = computed(() => this.$openCount());

    private readonly usersStore = inject(UsersStore);
    private readonly reportsService = inject(ReportsService);
    private readonly $openCount = signal(0);

    public constructor() {
        effect(() => {
            if (this.usersStore.isLoggedIn() && this.usersStore.isStaff()) {
                void this.reload();
            } else {
                this.$openCount.set(0);
            }
        });
    }

    public setOpenCount(count: number): void {
        this.$openCount.set(Math.max(0, count));
    }

    public async reload(): Promise<void> {
        if (!this.usersStore.isStaff()) {
            this.$openCount.set(0);
            return;
        }

        try {
            const openCount = await firstValueFrom(this.reportsService.countOpen());
            this.setOpenCount(openCount);
        } catch {
            /* ignore transient count failures */
        }
    }
}
