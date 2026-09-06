import { computed, inject, Injectable, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { FriendStatusId } from "../models/friend-status";
import { Friend } from "../models/friend.model";
import { DirectMessage } from "../models/message.model";
import { MessengerRealtimeService } from "../services/messenger-realtime.service";
import { FriendsStore } from "./friends.store";
import { MessagesStore } from "./messages.store";

export type MessengerTab = "chats" | "contacts";

export interface MessengerConversation {
    peerId: number;
    label: string;
    lastMessage: string;
    lastDate: Date;
}

export interface FriendUpdatedPayload {
    publicId: string;
    idFriendAsking: number;
    idFriendReceive: number;
    idFriendStatus: number;
}

@Injectable({ providedIn: "root" })
export class MessengerStore {
    public readonly isOpen = computed(() => this.$open());
    public readonly tab = computed(() => this.$tab());
    public readonly selectedPeerId = computed(() => this.$selectedPeerId());

    public readonly conversations = computed((): MessengerConversation[] => {
        const me = this.usersStore.user()?.id;
        if (!me) {
            return [];
        }

        const byPeer = new Map<number, DirectMessage>();
        for (const message of this.messagesStore.messages.value()) {
            const peerId = message.idSender === me ? message.idReceiver : message.idSender;
            const previous = byPeer.get(peerId);
            if (!previous || message.creationDate > previous.creationDate) {
                byPeer.set(peerId, message);
            }
        }

        return [...byPeer.entries()]
            .map(([peerId, message]) => ({
                peerId,
                label: this.peerLabel(peerId),
                lastMessage: message.content,
                lastDate: message.creationDate,
            }))
            .sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
    });

    public readonly threadMessages = computed((): DirectMessage[] => {
        const me = this.usersStore.user()?.id;
        const peerId = this.$selectedPeerId();
        if (!me || peerId == null) {
            return [];
        }

        return this.messagesStore.messages
            .value()
            .filter(
                (message) =>
                    (message.idSender === me && message.idReceiver === peerId) ||
                    (message.idSender === peerId && message.idReceiver === me),
            )
            .sort((a, b) => a.creationDate.getTime() - b.creationDate.getTime());
    });

    public readonly selectedLabel = computed(() => {
        const peerId = this.$selectedPeerId();
        return peerId == null ? "" : this.peerLabel(peerId);
    });

    public readonly friendsLoading = computed(() => this.friendsStore.loading());
    public readonly messagesLoading = computed(() => this.messagesStore.loading());
    public readonly sending = computed(() => this.messagesStore.sending());
    public readonly placeholderText = computed(() => this.messagesStore.placeholderText);
    public readonly isLive = computed(() => this.realtime.isLive());
    public readonly realtimeStatus = computed(() => this.realtime.status());
    public readonly realtimeOfflineMessage = computed(() => this.realtime.offlineMessage());
    public readonly managedContacts = computed(() => this.friendsStore.managedContacts());
    public readonly pendingIncomingCount = computed(() => this.friendsStore.pendingIncomingCount());
    public readonly actionLoading = computed(() => this.friendsStore.actionLoading());

    public readonly unreadMessagesCount = computed(() => this.messagesStore.unreadCount());
    public readonly contactsBadgeCount = computed(() => this.pendingIncomingCount());
    public readonly chatsBadgeCount = computed(() => this.unreadMessagesCount());
    public readonly totalBadgeCount = computed(() => this.contactsBadgeCount() + this.chatsBadgeCount());

    private readonly $open = signal(false);
    private readonly $tab = signal<MessengerTab>("chats");
    private readonly $selectedPeerId = signal<number | null>(null);

    private readonly usersStore = inject(UsersStore);
    private readonly friendsStore = inject(FriendsStore);
    private readonly messagesStore = inject(MessagesStore);
    private readonly realtime = inject(MessengerRealtimeService);

    public open(tab: MessengerTab = "chats"): void {
        this.$tab.set(tab);
        this.$open.set(true);
        this.$selectedPeerId.set(null);
        this.refresh();
    }

    public refresh(): void {
        this.friendsStore.reload();
        this.messagesStore.reload();
    }

    public close(): void {
        this.$open.set(false);
        this.$selectedPeerId.set(null);
    }

    public toggle(): void {
        if (this.$open()) {
            this.close();
        } else {
            this.open(this.$tab());
        }
    }

    public setTab(tab: MessengerTab): void {
        this.$tab.set(tab);
        this.$selectedPeerId.set(null);
    }

    public selectPeer(peerId: number): void {
        this.$selectedPeerId.set(peerId);
        this.$tab.set("chats");
        void this.messagesStore.markThreadRead(peerId);
    }

    public openThread(peerId: number): void {
        this.selectPeer(peerId);
        this.$open.set(true);
    }

    public clearThread(): void {
        this.$selectedPeerId.set(null);
    }

    public async send(content: string): Promise<void> {
        if (!this.realtime.isLive()) {
            return;
        }
        const peerId = this.$selectedPeerId();
        if (peerId == null) {
            return;
        }
        await this.messagesStore.send(peerId, content);
    }

    public onFriendUpdated(payload: FriendUpdatedPayload): void {
        const me = this.usersStore.user()?.id;
        if (
            me != null &&
            payload.idFriendReceive === me &&
            payload.idFriendStatus === FriendStatusId.Pending
        ) {
            this.open("contacts");
        }
    }

    public accept(friend: Friend): Promise<void> {
        return this.friendsStore.accept(friend);
    }

    public refuse(friend: Friend): Promise<void> {
        return this.friendsStore.refuse(friend);
    }

    public block(friend: Friend): Promise<void> {
        return this.friendsStore.block(friend);
    }

    public isIncomingPending(friend: Friend): boolean {
        const me = this.usersStore.user()?.id;
        return (
            me != null &&
            friend.idFriendStatus === FriendStatusId.Pending &&
            friend.idFriendReceive === me
        );
    }

    public isOutgoingPending(friend: Friend): boolean {
        const me = this.usersStore.user()?.id;
        return (
            me != null &&
            friend.idFriendStatus === FriendStatusId.Pending &&
            friend.idFriendAsking === me
        );
    }

    public isAccepted(friend: Friend): boolean {
        return friend.idFriendStatus === FriendStatusId.Accepted;
    }

    public isBlocked(friend: Friend): boolean {
        return friend.idFriendStatus === FriendStatusId.Blocked;
    }

    private peerLabel(peerId: number): string {
        const friend = this.friendsStore.friends.value().find((f) => f.peerId === peerId);
        if (friend) {
            return friend.peerLabel;
        }
        return $localize`:@@social.messenger.peerLabel:Player #${peerId}:peerId:`;
    }
}
