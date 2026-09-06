import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { DirectMessage } from "../models/message.model";
import { MessagesService } from "../services/messages.service";

const THREAD_PAGE_SIZE = 20;

@Injectable({ providedIn: "root" })
export class MessagesStore {
    public readonly messages = resource({
        params: () => this.usersStore.isLoggedIn(),
        loader: ({ params: loggedIn }) => {
            if (!loggedIn) {
                return Promise.resolve([] as DirectMessage[]);
            }
            return firstValueFrom(this.messagesService.list().pipe(catchError(() => of([] as DirectMessage[]))));
        },
        defaultValue: [] as DirectMessage[],
    });

    public readonly loading = computed(() => this.messages.isLoading());
    public readonly sending = computed(() => this.$sending());
    public readonly isEmpty = computed(() => this.messages.value().length === 0);
    public readonly unreadCount = computed(() =>
        this.messages.value().reduce((sum, message) => sum + (message.unreadCount || 0), 0),
    );
    public readonly placeholderText = $localize`:@@social.messages.placeholder:Your whispers will appear here.`;

    public readonly threadMessages = computed(() => this.$threadMessages());
    public readonly threadPeerId = computed(() => this.$threadPeerId());
    public readonly threadHasMore = computed(() => this.$threadHasMore());
    public readonly threadLoading = computed(() => this.$threadLoading());
    public readonly threadLoadingOlder = computed(() => this.$threadLoadingOlder());

    private readonly $sending = signal(false);
    private readonly $threadMessages = signal<DirectMessage[]>([]);
    private readonly $threadPeerId = signal<number | null>(null);
    private readonly $threadHasMore = signal(false);
    private readonly $threadLoading = signal(false);
    private readonly $threadLoadingOlder = signal(false);

    private readonly messagesService = inject(MessagesService);
    private readonly usersStore = inject(UsersStore);

    public reload(): void {
        if (!this.usersStore.isLoggedIn()) {
            return;
        }
        this.messages.reload();
    }

    public clearThread(): void {
        this.$threadPeerId.set(null);
        this.$threadMessages.set([]);
        this.$threadHasMore.set(false);
        this.$threadLoading.set(false);
        this.$threadLoadingOlder.set(false);
    }

    public async loadThread(peerId: number): Promise<void> {
        if (peerId <= 0) {
            return;
        }

        this.$threadPeerId.set(peerId);
        this.$threadLoading.set(true);
        this.$threadHasMore.set(false);
        try {
            const page = await firstValueFrom(
                this.messagesService.listThread(peerId, undefined, THREAD_PAGE_SIZE).pipe(
                    catchError(() => of([] as DirectMessage[])),
                ),
            );
            const chronological = [...page].reverse();
            this.$threadMessages.set(chronological);
            this.$threadHasMore.set(page.length >= THREAD_PAGE_SIZE);
        } finally {
            this.$threadLoading.set(false);
        }
    }

    public async loadOlder(): Promise<boolean> {
        const peerId = this.$threadPeerId();
        const current = this.$threadMessages();
        if (peerId == null || !this.$threadHasMore() || this.$threadLoadingOlder() || current.length === 0) {
            return false;
        }

        const beforeId = current[0]?.id;
        if (!beforeId) {
            return false;
        }

        this.$threadLoadingOlder.set(true);
        try {
            const page = await firstValueFrom(
                this.messagesService.listThread(peerId, beforeId, THREAD_PAGE_SIZE).pipe(
                    catchError(() => of([] as DirectMessage[])),
                ),
            );
            if (page.length === 0) {
                this.$threadHasMore.set(false);
                return false;
            }

            const chronological = [...page].reverse();
            const known = new Set(current.map((message) => message.publicId));
            const older = chronological.filter((message) => !known.has(message.publicId));
            this.$threadMessages.set([...older, ...current]);
            this.$threadHasMore.set(page.length >= THREAD_PAGE_SIZE);
            return older.length > 0;
        } finally {
            this.$threadLoadingOlder.set(false);
        }
    }

    public upsert(message: DirectMessage): void {
        this.upsertConversationPreview(message);

        const threadPeerId = this.$threadPeerId();
        if (threadPeerId == null || !this.isThreadMessage(message, threadPeerId)) {
            return;
        }

        const current = this.$threadMessages();
        if (current.some((item) => item.publicId === message.publicId || item.id === message.id)) {
            return;
        }
        this.$threadMessages.set([...current, message]);
    }

    public async markThreadRead(peerId: number): Promise<void> {
        const me = Number(this.usersStore.user()?.id);
        if (!me || peerId <= 0) {
            return;
        }

        await firstValueFrom(this.messagesService.markThreadRead(peerId).pipe(catchError(() => of(0))));

        this.messages.set(
            this.messages.value().map((message) => {
                const digestPeer = message.idSender === me ? message.idReceiver : message.idSender;
                return digestPeer === peerId ? message.withRead(true).withUnreadCount(0) : message;
            }),
        );

        if (this.$threadPeerId() === peerId) {
            this.$threadMessages.set(this.$threadMessages().map((message) => message.withRead(true)));
        }
    }

    public async send(idReceiver: number, content: string): Promise<void> {
        const trimmed = content.trim();
        if (!trimmed || idReceiver <= 0) {
            return;
        }

        this.$sending.set(true);
        try {
            await firstValueFrom(this.messagesService.create(idReceiver, trimmed));
        } finally {
            this.$sending.set(false);
        }
    }

    private upsertConversationPreview(message: DirectMessage): void {
        const me = Number(this.usersStore.user()?.id);
        if (!me) {
            return;
        }

        const peerId = message.idSender === me ? message.idReceiver : message.idSender;
        const current = this.messages.value();
        const index = current.findIndex((item) => {
            const itemPeer = item.idSender === me ? item.idReceiver : item.idSender;
            return itemPeer === peerId;
        });

        const incomingForMe = message.idReceiver === me && message.idSender === peerId;
        const viewing = this.$threadPeerId() === peerId;

        if (index < 0) {
            const unreadCount = incomingForMe && !viewing ? 1 : 0;
            this.messages.set([message.withUnreadCount(unreadCount), ...current]);
            return;
        }

        const previous = current[index];
        let unreadCount = previous.unreadCount || 0;
        if (incomingForMe && !viewing) {
            unreadCount += 1;
        } else if (viewing) {
            unreadCount = 0;
        }

        const next = [...current];
        next.splice(index, 1);
        this.messages.set([message.withUnreadCount(unreadCount), ...next]);
    }

    private isThreadMessage(message: DirectMessage, peerId: number): boolean {
        const me = Number(this.usersStore.user()?.id);
        if (!me) {
            return false;
        }
        return (
            (message.idSender === me && message.idReceiver === peerId) ||
            (message.idSender === peerId && message.idReceiver === me)
        );
    }
}
