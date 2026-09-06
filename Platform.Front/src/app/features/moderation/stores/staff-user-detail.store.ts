import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { StaffUserDetail } from "../models/staff-user.model";
import { SanctionsService } from "../services/sanctions.service";
import { StaffUsersService } from "../services/staff-users.service";
import { UserRolesService } from "../services/user-roles.service";

@Injectable()
export class StaffUserDetailStore {
    private readonly users = inject(StaffUsersService);
    private readonly sanctions = inject(SanctionsService);
    private readonly roles = inject(UserRolesService);

    private readonly $detail = signal<StaffUserDetail | null>(null);
    private readonly $loading = signal(false);
    private readonly $busy = signal(false);

    public readonly detail = computed(() => this.$detail());
    public readonly loading = computed(() => this.$loading());
    public readonly busy = computed(() => this.$busy());

    public async load(publicId: string): Promise<void> {
        this.$loading.set(true);
        try {
            this.$detail.set(await firstValueFrom(this.users.getDetail(publicId)));
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

    public async mute(reason: string, endDate: Date): Promise<void> {
        await this.createSanction("mute", reason, endDate);
    }

    public async ban(reason: string, endDate: Date | null): Promise<void> {
        await this.createSanction("ban", reason, endDate);
    }

    public async revoke(publicId: string): Promise<void> {
        const user = this.$detail();
        if (!user) {
            return;
        }
        this.$busy.set(true);
        try {
            await firstValueFrom(this.sanctions.revoke(publicId));
            await this.load(user.publicId);
        } finally {
            this.$busy.set(false);
        }
    }

    public async setSiteRole(code: string): Promise<void> {
        const user = this.$detail();
        if (!user) {
            return;
        }
        this.$busy.set(true);
        try {
            await firstValueFrom(this.roles.updateSiteRole({ targetPublicId: user.publicId, code }));
            await this.load(user.publicId);
        } finally {
            this.$busy.set(false);
        }
    }

    public async setGameRole(gameUrlValue: string, code: string | null): Promise<void> {
        const user = this.$detail();
        if (!user) {
            return;
        }
        this.$busy.set(true);
        try {
            await firstValueFrom(
                this.roles.updateGameRole({ targetPublicId: user.publicId, gameUrlValue, code }),
            );
            await this.load(user.publicId);
        } finally {
            this.$busy.set(false);
        }
    }

    private async createSanction(kind: string, entitled: string, endDate: Date | null): Promise<void> {
        const user = this.$detail();
        if (!user) {
            return;
        }
        this.$busy.set(true);
        try {
            await firstValueFrom(
                this.sanctions.create({
                    targetPublicId: user.publicId,
                    kind,
                    entitled,
                    endDate: endDate?.toISOString() ?? null,
                }),
            );
            await this.load(user.publicId);
        } finally {
            this.$busy.set(false);
        }
    }
}
