import { Component, computed, inject, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbCardModule, NbSpinnerModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-profile",
    imports: [NbCardModule, NbButtonModule, NbSpinnerModule],
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent {
    public readonly usersStore = inject(UsersStore);
    public readonly avatarIds = this.usersStore.listAvatarIds();
    public readonly selectedId = signal<number | null>(null);
    public readonly saving = signal(false);

    public readonly previewUrl = computed(() => {
        const id = this.selectedId();
        if (id != null) {
            return this.usersStore.avatarUrlForId(id);
        }
        return this.usersStore.user()?.avatarUrl ?? "";
    });

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
