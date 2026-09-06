import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { FriendStatusId, FriendStatusIdValue } from "../models/friend-status";
import { Friend } from "../models/friend.model";
import { FriendsService } from "../services/friends.service";

export type FriendRelationKind =
    | "none"
    | "pendingOutgoing"
    | "pendingIncoming"
    | "accepted"
    | "blockedByMe"
    | "blockedByPeer"
    | "blocked"
    | "refused";

@Injectable({ providedIn: "root" })
export class FriendsStore {
    public readonly friends = resource({
        params: () => this.usersStore.isLoggedIn(),
        loader: ({ params: loggedIn }) => {
            if (!loggedIn) {
                return Promise.resolve([] as Friend[]);
            }
            return firstValueFrom(this.friendsService.list().pipe(catchError(() => of([] as Friend[]))));
        },
        defaultValue: [] as Friend[],
    });

    public readonly loading = computed(() => this.friends.isLoading());
    public readonly actionLoading = computed(() => this.$actionLoading());
    public readonly isEmpty = computed(() => this.friends.value().length === 0);

    public readonly pendingIncoming = computed(() => {
        const me = this.usersStore.user()?.id;
        if (!me) {
            return [] as Friend[];
        }
        return this.sortRecent(
            this.friends
                .value()
                .filter((f) => f.idFriendStatus === FriendStatusId.Pending && f.idFriendReceive === me),
        );
    });

    public readonly pendingOutgoing = computed(() => {
        const me = this.usersStore.user()?.id;
        if (!me) {
            return [] as Friend[];
        }
        return this.sortRecent(
            this.friends
                .value()
                .filter((f) => f.idFriendStatus === FriendStatusId.Pending && f.idFriendAsking === me),
        );
    });

    public readonly accepted = computed(() =>
        this.sortRecent(this.friends.value().filter((f) => f.idFriendStatus === FriendStatusId.Accepted)),
    );

    public readonly blocked = computed(() =>
        this.sortRecent(this.friends.value().filter((f) => f.idFriendStatus === FriendStatusId.Blocked)),
    );

    /** Contacts tab: pending first (incoming then outgoing), then friends, then blocked — recent within each. */
    public readonly managedContacts = computed(() => [
        ...this.pendingIncoming(),
        ...this.pendingOutgoing(),
        ...this.accepted(),
        ...this.blocked(),
    ]);

    public readonly pendingIncomingCount = computed(() => this.pendingIncoming().length);

    private readonly $actionLoading = signal(false);
    private readonly friendsService = inject(FriendsService);
    private readonly usersStore = inject(UsersStore);

    public reload(): void {
        if (!this.usersStore.isLoggedIn()) {
            return;
        }
        this.friends.reload();
    }

    public peerId(friend: Friend): number {
        return friend.peerId;
    }

    public peerLabel(friend: Friend): string {
        return friend.peerLabel;
    }

    public relationWith(userId: number | null | undefined): Friend | null {
        if (!userId) {
            return null;
        }
        return this.friends.value().find((f) => f.peerId === userId) ?? null;
    }

    public relationKindWith(userId: number | null | undefined): FriendRelationKind {
        const me = this.usersStore.user()?.id;
        const friend = this.relationWith(userId);
        if (!me || !friend) {
            return "none";
        }
        if (friend.idFriendStatus === FriendStatusId.Accepted) {
            return "accepted";
        }
        if (friend.idFriendStatus === FriendStatusId.Blocked) {
            return friend.idFriendAsking === me ? "blockedByMe" : "blockedByPeer";
        }
        if (friend.idFriendStatus === FriendStatusId.Refused) {
            return "refused";
        }
        if (friend.idFriendStatus === FriendStatusId.Pending) {
            return friend.idFriendReceive === me ? "pendingIncoming" : "pendingOutgoing";
        }
        return "none";
    }

    public async request(userId: number): Promise<void> {
        if (userId <= 0) {
            return;
        }
        this.$actionLoading.set(true);
        try {
            await firstValueFrom(this.friendsService.request(userId));
            this.reload();
        } finally {
            this.$actionLoading.set(false);
        }
    }

    public accept(friend: Friend): Promise<void> {
        return this.setStatus(friend, FriendStatusId.Accepted);
    }

    public refuse(friend: Friend): Promise<void> {
        return this.setStatus(friend, FriendStatusId.Refused);
    }

    public block(friend: Friend): Promise<void> {
        return this.setStatus(friend, FriendStatusId.Blocked);
    }

    public unblock(friend: Friend): Promise<void> {
        return this.setStatus(friend, FriendStatusId.Accepted);
    }

    public async unblockPeer(peerId: number): Promise<void> {
        const friend = this.relationWith(peerId);
        if (!friend || friend.idFriendStatus !== FriendStatusId.Blocked) {
            return;
        }
        await this.unblock(friend);
    }

    private async setStatus(friend: Friend, status: FriendStatusIdValue): Promise<void> {
        this.$actionLoading.set(true);
        try {
            await firstValueFrom(this.friendsService.updateStatus(friend, status));
            this.reload();
        } finally {
            this.$actionLoading.set(false);
        }
    }

    private sortRecent(friends: Friend[]): Friend[] {
        return [...friends].sort((a, b) => b.modificationDate.getTime() - a.modificationDate.getTime());
    }
}
