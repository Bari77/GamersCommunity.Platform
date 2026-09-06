import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbCardModule, NbCheckboxModule, NbDialogRef, NbInputModule } from "@nebular/theme";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { Conversation } from "../../models/conversation.model";
import { Friend } from "../../models/friend.model";
import { FriendsStore } from "../../stores/friends.store";
import { MessengerStore } from "../../stores/messenger.store";

@Component({
    standalone: true,
    selector: "app-manage-group-dialog",
    templateUrl: "./manage-group-dialog.component.html",
    styleUrl: "./manage-group-dialog.component.scss",
    imports: [FormsModule, NbCardModule, NbButtonModule, NbInputModule, NbCheckboxModule, UserHandleComponent],
})
export class ManageGroupDialogComponent {
    public set initial(conversation: Conversation) {
        this.setConversation(conversation);
    }

    public readonly conversation = signal<Conversation | null>(null);
    public readonly usersStore = inject(UsersStore);
    public readonly title = signal("");
    public readonly selectedAvatarId = signal<number | null>(null);
    public readonly addQuery = signal("");
    public readonly selectedIds = signal<Set<number>>(new Set());
    public readonly avatarIds = this.usersStore.listAvatarIds();

    public readonly isOwner = computed(() => this.conversation()?.isOwner ?? false);
    public readonly members = computed(() => this.conversation()?.members ?? []);

    public readonly addableContacts = computed(() => {
        const memberIds = new Set(this.members().map((member) => member.id));
        const q = this.addQuery().trim().toLowerCase();
        return this.friendsStore.accepted().filter((friend) => {
            if (memberIds.has(friend.peerId)) {
                return false;
            }
            if (!q) {
                return true;
            }
            const handle = `${friend.peerNickname}#${friend.peerDiscriminator}`.toLowerCase();
            return handle.includes(q) || friend.peerNickname.toLowerCase().includes(q);
        });
    });

    public readonly pendingDelete = signal(false);
    public readonly deleting = signal(false);

    private readonly friendsStore = inject(FriendsStore);
    private readonly messengerStore = inject(MessengerStore);
    private readonly dialogRef = inject(NbDialogRef<ManageGroupDialogComponent>);

    public setConversation(conversation: Conversation): void {
        this.conversation.set(conversation);
        this.title.set(conversation.title ?? "");
        this.selectedAvatarId.set(null);
        this.selectedIds.set(new Set());
    }

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

    public async saveDetails(): Promise<void> {
        await this.messengerStore.updateGroup(this.title().trim() || null, this.selectedAvatarId());
        this.syncFromStore();
    }

    public async addSelected(): Promise<void> {
        const ids = [...this.selectedIds()];
        if (ids.length === 0) {
            return;
        }
        await this.messengerStore.addMembers(ids);
        this.selectedIds.set(new Set());
        this.syncFromStore();
    }

    public async removeMember(memberId: number): Promise<void> {
        const remaining = this.members().filter((member) => member.id !== memberId).length;
        if (remaining < 2) {
            this.pendingDelete.set(true);
            return;
        }
        await this.messengerStore.removeMember(memberId);
        this.syncFromStore();
    }

    public cancelDelete(): void {
        this.pendingDelete.set(false);
    }

    public async confirmDeleteGroup(): Promise<void> {
        if (this.deleting()) {
            return;
        }
        this.deleting.set(true);
        try {
            const deleted = await this.messengerStore.deleteGroup();
            if (deleted) {
                this.dialogRef.close();
            }
        } finally {
            this.deleting.set(false);
            this.pendingDelete.set(false);
        }
    }

    public close(): void {
        this.dialogRef.close();
    }

    public openProfile(publicId: string): void {
        this.dialogRef.close({ openProfile: publicId });
    }

    private syncFromStore(): void {
        const current = this.messengerStore.selectedConversation();
        if (current) {
            this.conversation.set(current);
            this.title.set(current.title ?? "");
        }
    }
}
