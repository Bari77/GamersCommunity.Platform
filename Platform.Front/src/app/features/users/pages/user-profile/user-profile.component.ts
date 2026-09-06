import { DatePipe } from "@angular/common";
import { Component, effect, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FriendRelationKind, FriendsStore } from "@features/social/stores/friends.store";
import { MessengerStore } from "@features/social/stores/messenger.store";
import { UsersStore } from "@features/users/stores/users.store";
import { isUserOnline } from "@features/users/utils/presence.util";
import { NbButtonModule, NbSpinnerModule } from "@nebular/theme";
import { PublicUser } from "../../models/public-user.model";
import { UserDirectoryStore } from "../../stores/user-directory.store";

@Component({
    standalone: true,
    selector: "app-user-profile",
    imports: [NbButtonModule, NbSpinnerModule, DatePipe, RouterLink],
    templateUrl: "./user-profile.component.html",
    styleUrl: "./user-profile.component.scss",
})
export class UserProfileComponent {
    public readonly publicId = input.required<string>();
    public readonly directoryStore = inject(UserDirectoryStore);
    public readonly usersStore = inject(UsersStore);
    public readonly friendsStore = inject(FriendsStore);
    public readonly messengerStore = inject(MessengerStore);

    public constructor() {
        effect(() => {
            this.directoryStore.selectByPublicId(this.publicId());
        });

        effect(() => {
            if (this.usersStore.isLoggedIn()) {
                this.friendsStore.reload();
            }
        });
    }

    public isOwnProfile(): boolean {
        return this.usersStore.user()?.publicId === this.publicId();
    }

    public isOnline(lastConnection: Date | null): boolean {
        return isUserOnline(lastConnection);
    }

    public relationKind(user: PublicUser): FriendRelationKind {
        return this.friendsStore.relationKindWith(user.id);
    }

    public async addFriend(user: PublicUser): Promise<void> {
        await this.friendsStore.request(user.id);
    }

    public async accept(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.accept(friend);
        }
    }

    public async refuse(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.refuse(friend);
        }
    }

    public async block(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.block(friend);
        }
    }

    public async unblock(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.unblock(friend);
        }
    }

    public whisper(user: PublicUser): void {
        this.messengerStore.openThread(user.id);
    }
}
