import { computed, inject, Injectable, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { Conversation } from "../models/conversation.model";
import { FriendStatusId } from "../models/friend-status";
import { Friend } from "../models/friend.model";
import { DirectMessage } from "../models/message.model";
import { ConversationsService } from "../services/conversations.service";
import { MessengerRealtimeService } from "../services/messenger-realtime.service";
import { FriendsStore } from "./friends.store";
import { MessagesStore } from "./messages.store";

export type MessengerTab = "chats" | "contacts";

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
    public readonly selectedConversationPublicId = computed(() => this.$selectedConversationPublicId());

    public readonly conversations = computed(() =>
        [...this.messagesStore.conversations.value()].sort((a, b) => {
            const aDate = a.lastDate?.getTime() ?? a.creationDate.getTime();
            const bDate = b.lastDate?.getTime() ?? b.creationDate.getTime();
            return bDate - aDate;
        }),
    );

    public readonly selectedConversation = computed((): Conversation | null => {
        const publicId = this.$selectedConversationPublicId();
        if (!publicId) {
            return null;
        }
        return this.messagesStore.conversations.value().find((item) => item.publicId === publicId) ?? null;
    });

    public readonly selectedPeerId = computed(() => this.selectedConversation()?.peerId ?? null);

    public readonly threadMessages = computed((): DirectMessage[] => {
        if (!this.$selectedConversationPublicId()) {
            return [];
        }
        return this.messagesStore.threadMessages();
    });

    public readonly selectedLabel = computed(() => this.selectedConversation()?.displayTitle ?? "");
    public readonly selectedNickname = computed(() => this.selectedConversation()?.peerNickname ?? this.selectedLabel());
    public readonly selectedDiscriminator = computed(() => this.selectedConversation()?.peerDiscriminator ?? "");
    public readonly selectedPeerPublicId = computed(() => this.selectedConversation()?.peerPublicId ?? "");
    public readonly selectedPeerAvatarUrl = computed(
        () => this.selectedConversation()?.pictureUrl || this.selectedConversation()?.peerAvatarUrl || "",
    );
    public readonly selectedIsGroup = computed(() => this.selectedConversation()?.isGroup ?? false);
    public readonly selectedIsOwner = computed(() => this.selectedConversation()?.isOwner ?? false);
    public readonly selectedMembers = computed(() => this.selectedConversation()?.members ?? []);

    public readonly friendsLoading = computed(() => this.friendsStore.loading());
    public readonly messagesLoading = computed(() => {
        if (this.$selectedConversationPublicId()) {
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
    public readonly acceptedContacts = computed(() => this.friendsStore.accepted());
    public readonly pendingIncomingCount = computed(() => this.friendsStore.pendingIncomingCount());
    public readonly actionLoading = computed(() => this.friendsStore.actionLoading());

    public readonly unreadMessagesCount = computed(() => this.messagesStore.unreadCount());
    public readonly contactsBadgeCount = computed(() => this.pendingIncomingCount());
    public readonly chatsBadgeCount = computed(() => this.unreadMessagesCount());
    public readonly totalBadgeCount = computed(() => this.contactsBadgeCount() + this.chatsBadgeCount());

    public readonly threadBlockState = computed((): "none" | "blockedByMe" | "blockedByPeer" => {
        const conversation = this.selectedConversation();
        if (!conversation || conversation.isGroup || conversation.peerId == null) {
            return "none";
        }
        const kind = this.friendsStore.relationKindWith(conversation.peerId);
        if (kind === "blockedByMe") {
            return "blockedByMe";
        }
        if (kind === "blockedByPeer") {
            return "blockedByPeer";
        }
        return "none";
    });

    public readonly canCompose = computed(
        () => this.isLive() && this.threadBlockState() === "none" && this.$selectedConversationPublicId() != null,
    );

    private readonly $open = signal(false);
    private readonly $tab = signal<MessengerTab>("chats");
    private readonly $selectedConversationPublicId = signal<string | null>(null);

    private readonly usersStore = inject(UsersStore);
    private readonly friendsStore = inject(FriendsStore);
    private readonly messagesStore = inject(MessagesStore);
    private readonly conversationsService = inject(ConversationsService);
    private readonly realtime = inject(MessengerRealtimeService);

    public open(tab: MessengerTab = "chats"): void {
        this.$tab.set(tab);
        this.$open.set(true);
        this.$selectedConversationPublicId.set(null);
        this.messagesStore.clearThread();
        this.refresh();
    }

    public refresh(): void {
        this.friendsStore.reload();
        this.messagesStore.reload();
    }

    public close(): void {
        this.$open.set(false);
        this.$selectedConversationPublicId.set(null);
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
        this.$selectedConversationPublicId.set(null);
        this.messagesStore.clearThread();
    }

    public selectConversation(publicId: string): void {
        if (!publicId) {
            return;
        }
        this.$selectedConversationPublicId.set(publicId);
        this.$tab.set("chats");
        void this.messagesStore.loadThread(publicId);
        void this.messagesStore.markThreadRead(publicId);
        void this.refreshConversation(publicId);
        this.$open.set(true);
    }

    public openThread(peerId: number): void {
        void this.openDm(peerId);
    }

    public async openDm(peerId: number): Promise<void> {
        const existing = this.messagesStore.conversations
            .value()
            .find((conversation) => !conversation.isGroup && conversation.peerId === peerId);
        if (existing) {
            this.selectConversation(existing.publicId);
            return;
        }

        const created = await firstValueFrom(
            this.conversationsService.create([peerId]).pipe(catchError(() => of(null))),
        );
        if (!created?.publicId) {
            return;
        }
        this.messagesStore.replaceConversation(created);
        this.selectConversation(created.publicId);
    }

    public async createGroup(memberIds: number[], title?: string | null, avatarId?: number | null): Promise<void> {
        const created = await firstValueFrom(
            this.conversationsService.create(memberIds, title, avatarId).pipe(catchError(() => of(null))),
        );
        if (!created?.publicId) {
            return;
        }
        this.messagesStore.replaceConversation(created);
        this.selectConversation(created.publicId);
    }

    public async addMembers(memberIds: number[]): Promise<void> {
        const publicId = this.$selectedConversationPublicId();
        if (!publicId || memberIds.length === 0) {
            return;
        }
        const updated = await firstValueFrom(
            this.conversationsService.addMembers(publicId, memberIds).pipe(catchError(() => of(null))),
        );
        if (updated) {
            this.messagesStore.replaceConversation(updated);
        }
    }

    public async removeMember(memberId: number): Promise<void> {
        const publicId = this.$selectedConversationPublicId();
        if (!publicId) {
            return;
        }
        const updated = await firstValueFrom(
            this.conversationsService.removeMembers(publicId, [memberId]).pipe(catchError(() => of(null))),
        );
        if (updated) {
            this.messagesStore.replaceConversation(updated);
        }
    }

    public async deleteGroup(): Promise<boolean> {
        const publicId = this.$selectedConversationPublicId();
        if (!publicId) {
            return false;
        }
        try {
            await firstValueFrom(this.conversationsService.deleteConversation(publicId));
        } catch {
            return false;
        }
        this.dropConversation(publicId);
        return true;
    }

    public handleConversationUpdated(publicId: string, deleted = false): void {
        if (deleted) {
            this.dropConversation(publicId);
            return;
        }
        void this.refreshConversation(publicId, true);
    }

    public async updateGroup(title?: string | null, avatarId?: number | null): Promise<void> {
        const publicId = this.$selectedConversationPublicId();
        if (!publicId) {
            return;
        }
        const updated = await firstValueFrom(
            this.conversationsService.update(publicId, title, avatarId).pipe(catchError(() => of(null))),
        );
        if (updated) {
            this.messagesStore.replaceConversation(updated);
        }
    }

    public clearThread(): void {
        this.$selectedConversationPublicId.set(null);
        this.messagesStore.clearThread();
    }

    public loadOlderMessages(): Promise<boolean> {
        return this.messagesStore.loadOlder();
    }

    public async send(content: string, parentPublicId?: string | null): Promise<void> {
        if (!this.canCompose()) {
            return;
        }
        const publicId = this.$selectedConversationPublicId();
        if (!publicId) {
            return;
        }
        await this.messagesStore.send(publicId, content, parentPublicId);
    }

    public retry(message: DirectMessage): Promise<void> {
        return this.messagesStore.retry(message);
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
        const peerId = this.selectedPeerId();
        if (peerId == null) {
            return Promise.resolve();
        }
        return this.friendsStore.unblockPeer(peerId);
    }

    public isIncomingPending(friend: Friend): boolean {
        const me = this.usersStore.user()?.id;
        return me != null && friend.idFriendStatus === FriendStatusId.Pending && friend.idFriendReceive === me;
    }

    public isOutgoingPending(friend: Friend): boolean {
        const me = this.usersStore.user()?.id;
        return me != null && friend.idFriendStatus === FriendStatusId.Pending && friend.idFriendAsking === me;
    }

    public isAccepted(friend: Friend): boolean {
        return friend.idFriendStatus === FriendStatusId.Accepted;
    }

    public isBlocked(friend: Friend): boolean {
        return friend.idFriendStatus === FriendStatusId.Blocked;
    }

    public isBlockedByMe(friend: Friend): boolean {
        const me = this.usersStore.user()?.id;
        return me != null && friend.idFriendStatus === FriendStatusId.Blocked && friend.idFriendAsking === me;
    }

    private async refreshConversation(publicId: string, reloadIfMissing = false): Promise<void> {
        const detail = await firstValueFrom(
            this.conversationsService.getByPublicId(publicId).pipe(catchError(() => of(null))),
        );
        if (detail) {
            this.messagesStore.replaceConversation(detail);
            return;
        }
        if (reloadIfMissing) {
            this.dropConversation(publicId);
            this.messagesStore.reload();
        }
    }

    private dropConversation(publicId: string): void {
        this.messagesStore.removeConversation(publicId);
        if (this.$selectedConversationPublicId() === publicId) {
            this.clearThread();
        }
    }
}
