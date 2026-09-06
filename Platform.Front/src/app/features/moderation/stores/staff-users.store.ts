import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { StaffUser } from "../models/staff-user.model";
import { StaffUsersService } from "../services/staff-users.service";

@Injectable()
export class StaffUsersStore {
    private readonly service = inject(StaffUsersService);

    private readonly $rows = signal<StaffUser[]>([]);
    private readonly $loading = signal(false);
    private readonly $query = signal("");
    private readonly $siteRole = signal("");
    private readonly $sanction = signal("");

    public readonly rows = computed(() => this.$rows());
    public readonly loading = computed(() => this.$loading());
    public readonly query = computed(() => this.$query());
    public readonly siteRole = computed(() => this.$siteRole());
    public readonly sanction = computed(() => this.$sanction());

    public setQuery(value: string): void {
        this.$query.set(value);
    }

    public setSiteRole(value: string): void {
        this.$siteRole.set(value);
    }

    public setSanction(value: string): void {
        this.$sanction.set(value);
    }

    public async reload(): Promise<void> {
        this.$loading.set(true);
        try {
            const rows = await firstValueFrom(
                this.service.list({
                    query: this.$query() || undefined,
                    siteRole: this.$siteRole() || undefined,
                    sanction: this.$sanction() || undefined,
                    take: 40,
                }),
            );
            this.$rows.set(rows);
        } finally {
            this.$loading.set(false);
        }
    }

    public async loaded(): Promise<void> {
        if (this.$loading()) {
            const start = Date.now();
            while (this.$loading() && Date.now() - start < 15_000) {
                await new Promise((resolve) => setTimeout(resolve, 40));
            }
        }
    }
}
