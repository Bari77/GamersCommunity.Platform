import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbCardModule, NbCheckboxModule, NbDialogRef, NbInputModule } from "@nebular/theme";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { Friend } from "../../models/friend.model";
import { FriendsStore } from "../../stores/friends.store";

@Component({
    standalone: true,
    selector: "app-create-group-dialog",
    templateUrl: "./create-group-dialog.component.html",
    styleUrl: "./create-group-dialog.component.scss",
    imports: [FormsModule, NbCardModule, NbButtonModule, NbInputModule, NbCheckboxModule, UserHandleComponent],
})
export class CreateGroupDialogComponent {
    public readonly usersStore = inject(UsersStore);
    public readonly query = signal("");
    public readonly title = signal("");
    public readonly selectedIds = signal<Set<number>>(new Set());
    public readonly selectedAvatarId = signal<number | null>(null);
    public readonly avatarIds = this.usersStore.listAvatarIds();

    public readonly contacts = computed(() => {
        const q = this.query().trim().toLowerCase();
        const friends = this.friendsStore.accepted();
        if (!q) {
            return friends;
        }
        return friends.filter((friend) => {
            const handle = `${friend.peerNickname}#${friend.peerDiscriminator}`.toLowerCase();
            return handle.includes(q) || friend.peerNickname.toLowerCase().includes(q);
        });
    });

    public readonly selectedCount = computed(() => this.selectedIds().size);
    public readonly isGroup = computed(() => this.selectedCount() >= 2);
    public readonly canSubmit = computed(() => this.selectedCount() >= 1);

    private readonly friendsStore = inject(FriendsStore);
    private readonly dialogRef = inject(NbDialogRef<CreateGroupDialogComponent>);

    public isSelected(friend: Friend): boolean {
        return this.selectedIds().has(friend.peerId);
    }

    public toggle(friend: Friend): void {
        const next = new Set(this.selectedIds());
        if (next.has(friend.peerId)) {
            next.delete(friend.peerId);
        } else {
            next.add(friend.peerId);
        }
        this.selectedIds.set(next);
    }

    public selectAvatar(id: number): void {
        this.selectedAvatarId.update((current) => (current === id ? null : id));
    }

    public submit(): void {
        if (!this.canSubmit()) {
            return;
        }
        this.dialogRef.close({
            memberIds: [...this.selectedIds()],
            title: this.isGroup() ? this.title().trim() || null : null,
            avatarId: this.isGroup() ? this.selectedAvatarId() : null,
        });
    }

    public cancel(): void {
        this.dialogRef.close(null);
    }
}
