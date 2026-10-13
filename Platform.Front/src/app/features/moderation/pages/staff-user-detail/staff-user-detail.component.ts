import { DatePipe } from "@angular/common";
import { Component, computed, effect, inject, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { PermissionsService } from "@core/services/permissions.service";
import { GamesStore } from "@features/games/stores/games.store";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbDialogService, NbSelectModule, NbSpinnerModule } from "@nebular/theme";
import { SkeletonComponent } from "@bari77/gc-ui";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { firstValueFrom } from "rxjs";
import { SanctionDialogComponent } from "../../components/sanction-dialog/sanction-dialog.component";
import { SanctionDialogResult } from "../../components/sanction-dialog/sanction-dialog-result.model";
import { StaffUserDetailStore } from "../../stores/staff-user-detail.store";

@Component({
    standalone: true,
    selector: "app-staff-user-detail",
    imports: [
        DatePipe,
        FormsModule,
        RouterLink,
        NbButtonModule,
        NbSelectModule,
        NbSpinnerModule,
        SkeletonComponent,
        UserHandleComponent,
    ],
    templateUrl: "./staff-user-detail.component.html",
    styleUrl: "./staff-user-detail.component.scss",
})
export class StaffUserDetailComponent {
    public readonly gameRolePlaceholders = [0, 1, 2];
    public readonly sanctionPlaceholders = [0, 1, 2];
    public readonly publicId = input.required<string>();
    public readonly store = inject(StaffUserDetailStore);
    public readonly permissions = inject(PermissionsService);
    public readonly usersStore = inject(UsersStore);
    public readonly gamesStore = inject(GamesStore);

    public readonly games = computed(() => (this.gamesStore.gameTypes.value() ?? []).flatMap((type) => type.games));

    private readonly dialogs = inject(NbDialogService);

    public constructor() {
        effect(() => {
            const publicId = this.publicId();
            if (publicId) {
                void this.store.load(publicId);
            }
        });
    }

    public isSelf(): boolean {
        return this.usersStore.user()?.publicId === this.publicId();
    }

    public gameRole(urlValue: string): string {
        const match = this.store.detail()?.gameRoles.find((role) => role.gameUrlValue === urlValue);
        return match?.code ?? "";
    }

    public async changeSiteRole(code: string): Promise<void> {
        if (!this.permissions.canManageRanks() || this.isSelf()) {
            return;
        }
        await this.store.setSiteRole(code);
    }

    public async changeGameRole(urlValue: string, code: string): Promise<void> {
        if (!this.permissions.canManageRanks() || this.isSelf()) {
            return;
        }
        await this.store.setGameRole(urlValue, code || null);
    }

    public async openSanction(kind: "mute" | "ban"): Promise<void> {
        const user = this.store.detail();
        if (!user || this.isSelf()) {
            return;
        }
        if (kind === "ban" && !this.permissions.canBan()) {
            return;
        }

        const ref = this.dialogs.open(SanctionDialogComponent, {
            context: { kind, nickname: user.fullNickname },
        });
        const result = (await firstValueFrom(ref.onClose)) as SanctionDialogResult | null;
        if (!result) {
            return;
        }
        if (kind === "mute") {
            await this.store.mute(result.reason, result.endDate ?? new Date(Date.now() + 86_400_000));
        } else {
            await this.store.ban(result.reason, result.endDate);
        }
    }

    public async revoke(publicId: string, kind: string): Promise<void> {
        if (kind === "ban" && !this.permissions.canBan()) {
            return;
        }
        await this.store.revoke(publicId);
    }
}
