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
    peerPublicId: string;
    nickname: string;
    discriminator: string;
    label: string;
    avatarUrl: string;
    lastMessage: string;
    lastDate: Date;
    unreadCount: number;
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
        const me = Number(this.usersStore.user()?.id);
        if (!me) {
            return [];
        }

        return this.messagesStore.messages
            .value()
            .map((message) => {
                const peerId = message.idSender === me ? message.idReceiver : message.idSender;
                const identity = this.peerIdentity(peerId);
                return {
                    peerId,
                    peerPublicId: identity.publicId,
                    nickname: identity.nickname,
                    discriminator: identity.discriminator,
                    label: identity.label,
                    avatarUrl: this.peerAvatarUrl(peerId),
                    lastMessage: message.content,
                    lastDate: message.creationDate,
                    unreadCount: message.unreadCount || 0,
                };
            })
            .sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
    });

    public readonly threadMessages = computed((): DirectMessage[] => {
        if (this.$selectedPeerId() == null) {
            return [];
        }
        return this.messagesStore.threadMessages();
    });

    public readonly selectedLabel = computed(() => {
        const peerId = this.$selectedPeerId();
        return peerId == null ? "" : this.peerIdentity(peerId).label;
    });

    public readonly selectedNickname = computed(() => {
        const peerId = this.$selectedPeerId();
        return peerId == null ? "" : this.peerIdentity(peerId).nickname;
    });

    public readonly selectedDiscriminator = computed(() => {
        const peerId = this.$selectedPeerId();
        return peerId == null ? "" : this.peerIdentity(peerId).discriminator;
    });

    public readonly selectedPeerPublicId = computed(() => {
        const peerId = this.$selectedPeerId();
        return peerId == null ? "" : this.peerIdentity(peerId).publicId;
    });

    public readonly selectedPeerAvatarUrl = computed(() => {
        const peerId = this.$selectedPeerId();
        return peerId == null ? "" : this.peerAvatarUrl(peerId);
    });

    public readonly friendsLoading = computed(() => this.friendsStore.loading());
    public readonly messagesLoading = computed(() => {
        if (this.$selectedPeerId() != null) {
            return this.messagesStore.threadLoading();
        }
        return this.messagesStore.loading();
    });
    public readonly threadHasMore = computed(() => this.messagesStore.threadHasMore());
    public readonly threadLoadingOlder = computed(() => this.messagesStore.threadLoadingOlder());
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

    public readonly threadBlockState = computed((): "none" | "blockedByMe" | "blockedByPeer" => {
        const peerId = this.$selectedPeerId();
        if (peerId == null) {
            return "none";
        }
        const kind = this.friendsStore.relationKindWith(peerId);
        if (kind === "blockedByMe") {
            return "blockedByMe";
        }
        if (kind === "blockedByPeer") {
            return "blockedByPeer";
        }
        return "none";
    });

    public readonly canCompose = computed(
        () => this.isLive() && this.threadBlockState() === "none" && this.$selectedPeerId() != null,
    );

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
        this.messagesStore.clearThread();
        this.refresh();
    }

    public refresh(): void {
        this.friendsStore.reload();
        this.messagesStore.reload();
    }

    public close(): void {
        this.$open.set(false);
        this.$selectedPeerId.set(null);
        this.messagesStore.clearThread();
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
        this.messagesStore.clearThread();
    }

    public selectPeer(peerId: number): void {
        this.$selectedPeerId.set(peerId);
        this.$tab.set("chats");
        void this.messagesStore.loadThread(peerId);
        void this.messagesStore.markThreadRead(peerId);
    }

    public openThread(peerId: number): void {
        this.selectPeer(peerId);
        this.$open.set(true);
    }

    public clearThread(): void {
        this.$selectedPeerId.set(null);
        this.messagesStore.clearThread();
    }

    public loadOlderMessages(): Promise<boolean> {
        return this.messagesStore.loadOlder();
    }

    public async send(content: string, parentPublicId?: string | null): Promise<void> {
        if (!this.canCompose()) {
            return;
        }
        const peerId = this.$selectedPeerId();
        if (peerId == null) {
            return;
        }
        await this.messagesStore.send(peerId, content, parentPublicId);
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

    public remove(friend: Friend): Promise<void> {
        return this.friendsStore.remove(friend);
    }

    public unblockSelectedPeer(): Promise<void> {
        const peerId = this.$selectedPeerId();
        if (peerId == null) {
            return Promise.resolve();
        }
        return this.friendsStore.unblockPeer(peerId);
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

    public isBlockedByMe(friend: Friend): boolean {
        const me = this.usersStore.user()?.id;
        return (
            me != null &&
            friend.idFriendStatus === FriendStatusId.Blocked &&
            friend.idFriendAsking === me
        );
    }

    private peerIdentity(peerId: number): {
        nickname: string;
        discriminator: string;
        publicId: string;
        label: string;
    } {
        const friend = this.friendsStore.friends.value().find((f) => f.peerId === peerId);
        if (friend) {
            return {
                nickname: friend.peerNickname,
                discriminator: friend.peerDiscriminator,
                publicId: friend.peerPublicId,
                label: friend.peerLabel,
            };
        }

        const label = $localize`:@@social.messenger.peerLabel:Player #${peerId}:peerId:`;
        return {
            nickname: label,
            discriminator: "",
            publicId: "",
            label,
        };
    }

    private peerAvatarUrl(peerId: number): string {
        return this.friendsStore.friends.value().find((f) => f.peerId === peerId)?.peerAvatarUrl ?? "";
    }
}
