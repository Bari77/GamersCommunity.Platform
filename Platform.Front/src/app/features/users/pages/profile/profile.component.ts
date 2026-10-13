import { Component, computed, inject, signal } from "@angular/core";
import { Game } from "@features/games/models/game.model";
import { GameSheetsStore } from "@features/games/stores/game-sheets.store";
import { toGameRootPath } from "@features/games/utils/game-url.util";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbCardModule, NbSpinnerModule } from "@nebular/theme";
import { GameTileComponent } from "@shared/components/game-tile/game-tile.component";
import { SkeletonComponent } from "@bari77/gc-ui";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { environment } from "environments/environment";

@Component({
    standalone: true,
    selector: "app-profile",
    imports: [NbCardModule, NbButtonModule, NbSpinnerModule, GameTileComponent, SkeletonComponent, UserHandleComponent],
    templateUrl: "./profile.component.html",
    styleUrl: "./profile.component.scss",
})
export class ProfileComponent {
    public readonly usersStore = inject(UsersStore);
    public readonly gameSheets = inject(GameSheetsStore);
    public readonly avatarIds = this.usersStore.listAvatarIds();
    public readonly selectedId = signal<number | null>(null);
    public readonly saving = signal(false);
    public readonly profileLoading = computed(() => !this.usersStore.user());

    public readonly previewUrl = computed(() => {
        const id = this.selectedId();
        if (id != null) {
            return this.usersStore.avatarUrlForId(id);
        }
        return this.usersStore.user()?.avatarUrl ?? "";
    });

    public assetsIcon(picture: string): string {
        return `${environment.assetsBaseUrl}/Icons/Games/${picture}.png`;
    }

    public playersLink(game: Game): string {
        return `${toGameRootPath(game.urlValue)}/players`;
    }

    public selectAvatar(id: number): void {
        this.selectedId.set(id);
    }

    public isSelected(id: number): boolean {
        const selected = this.selectedId();
        if (selected != null) {
            return selected === id;
        }
        return this.usersStore.user()?.avatarUrl === this.usersStore.avatarUrlForId(id);
    }

    public save(): void {
        const id = this.selectedId();
        if (id == null || this.saving()) {
            return;
        }

        this.saving.set(true);
        this.usersStore.updateUser({ avatarId: id }).subscribe({
            next: () => {
                this.selectedId.set(null);
                this.saving.set(false);
            },
            error: () => this.saving.set(false),
        });
    }
}
