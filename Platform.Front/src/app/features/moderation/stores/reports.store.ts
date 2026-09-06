import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ModerationReport } from "../models/staff-user.model";
import { ReportsService } from "../services/reports.service";

@Injectable()
export class ReportsStore {
    private readonly service = inject(ReportsService);

    private readonly $rows = signal<ModerationReport[]>([]);
    private readonly $loading = signal(false);
    private readonly $busy = signal(false);
    private readonly $status = signal("open");

    public readonly rows = computed(() => this.$rows());
    public readonly loading = computed(() => this.$loading());
    public readonly busy = computed(() => this.$busy());
    public readonly status = computed(() => this.$status());

    public setStatus(value: string): void {
        this.$status.set(value);
    }

    public async reload(): Promise<void> {
        this.$loading.set(true);
        try {
            this.$rows.set(await firstValueFrom(this.service.list({ status: this.$status(), take: 40 })));
        } finally {
            this.$loading.set(false);
        }
    }

    public async loaded(): Promise<void> {
        const start = Date.now();
        while (this.$loading() && Date.now() - start < 15_000) {
            await new Promise((resolve) => setTimeout(resolve, 40));
        }
    }

    public async updateStatus(publicId: string, status: string): Promise<void> {
        this.$busy.set(true);
        try {
            await firstValueFrom(this.service.updateStatus(publicId, status));
            await this.reload();
        } finally {
            this.$busy.set(false);
        }
    }
}
