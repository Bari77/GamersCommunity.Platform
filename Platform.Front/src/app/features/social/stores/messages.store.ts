import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { Conversation } from "../models/conversation.model";
import { DirectMessage } from "../models/message.model";
import { ConversationsService } from "../services/conversations.service";
import { MessagesService } from "../services/messages.service";

const THREAD_PAGE_SIZE = 20;

@Injectable({ providedIn: "root" })
export class MessagesStore {
    public readonly conversations = resource({
        params: () => this.usersStore.isLoggedIn(),
        loader: ({ params: loggedIn }) => {
            if (!loggedIn) {
                return Promise.resolve([] as Conversation[]);
            }
            return firstValueFrom(this.conversationsService.list().pipe(catchError(() => of([] as Conversation[]))));
        },
        defaultValue: [] as Conversation[],
    });

    public readonly loading = computed(() => this.conversations.isLoading());
    public readonly sending = computed(() => this.$sending());
    public readonly isEmpty = computed(() => this.conversations.value().length === 0);
    public readonly unreadCount = computed(() =>
        this.conversations.value().reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
    );
    public readonly placeholderText = $localize`:@@social.messages.placeholder:Your whispers will appear here.`;

    public readonly threadMessages = computed(() => this.$threadMessages());
    public readonly threadConversationPublicId = computed(() => this.$threadConversationPublicId());
    public readonly threadHasMore = computed(() => this.$threadHasMore());
    public readonly threadLoading = computed(() => this.$threadLoading());
    public readonly threadLoadingOlder = computed(() => this.$threadLoadingOlder());

    private readonly $sending = signal(false);
    private readonly $threadMessages = signal<DirectMessage[]>([]);
    private readonly $threadConversationPublicId = signal<string | null>(null);
    private readonly $threadHasMore = signal(false);
    private readonly $threadLoading = signal(false);
    private readonly $threadLoadingOlder = signal(false);

    private readonly messagesService = inject(MessagesService);
    private readonly conversationsService = inject(ConversationsService);
    private readonly usersStore = inject(UsersStore);

    public reload(): void {
        if (!this.usersStore.isLoggedIn()) {
            return;
        }
        this.conversations.reload();
    }

    public replaceConversation(conversation: Conversation): void {
        const current = this.conversations.value();
        const index = current.findIndex((item) => item.publicId === conversation.publicId);
        if (index < 0) {
            this.conversations.set([conversation, ...current]);
            return;
        }

        const next = [...current];
        const previous = next[index];
        next.splice(index, 1);
        this.conversations.set([
            conversation.withUnreadCount(conversation.unreadCount || previous.unreadCount),
            ...next,
        ]);
    }

    public removeConversation(publicId: string): void {
        this.conversations.set(this.conversations.value().filter((item) => item.publicId !== publicId));
        if (this.$threadConversationPublicId() === publicId) {
            this.clearThread();
        }
    }

    public clearThread(): void {
        this.$threadConversationPublicId.set(null);
        this.$threadMessages.set([]);
        this.$threadHasMore.set(false);
        this.$threadLoading.set(false);
        this.$threadLoadingOlder.set(false);
    }

    public async loadThread(conversationPublicId: string): Promise<void> {
        if (!conversationPublicId) {
            return;
        }

        const locals = this.$threadConversationPublicId() === conversationPublicId
            ? this.$threadMessages().filter((message) => message.isLocal)
            : [];

        this.$threadConversationPublicId.set(conversationPublicId);
        this.$threadLoading.set(true);
        this.$threadHasMore.set(false);
        this.$threadMessages.set(locals);
        try {
            const page = await firstValueFrom(
                this.messagesService.listThread(conversationPublicId, undefined, THREAD_PAGE_SIZE).pipe(
                    catchError(() => of([] as DirectMessage[])),
                ),
            );
            if (this.$threadConversationPublicId() !== conversationPublicId) {
                return;
            }
            const chronological = [...page].reverse();
            const currentLocals = this.$threadMessages().filter((message) => message.isLocal);
            this.$threadMessages.set([...chronological, ...this.unmatchedLocals(chronological, currentLocals)]);
            this.$threadHasMore.set(page.length >= THREAD_PAGE_SIZE);
        } finally {
            this.$threadLoading.set(false);
        }
    }

    public async loadOlder(): Promise<boolean> {
        const conversationPublicId = this.$threadConversationPublicId();
        const current = this.$threadMessages();
        if (!conversationPublicId || !this.$threadHasMore() || this.$threadLoadingOlder() || current.length === 0) {
            return false;
        }

        const beforePublicId = current.find((item) => item.delivery === "sent")?.publicId;
        if (!beforePublicId) {
            return false;
        }

        this.$threadLoadingOlder.set(true);
        try {
            const page = await firstValueFrom(
                this.messagesService
                    .listThread(conversationPublicId, beforePublicId, THREAD_PAGE_SIZE)
                    .pipe(catchError(() => of([] as DirectMessage[]))),
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

        if (this.$threadConversationPublicId() !== message.conversationPublicId) {
            return;
        }

        const current = this.$threadMessages();
        if (current.some((item) => item.publicId === message.publicId)) {
            return;
        }

        const localIndex = current.findIndex(
            (item) => item.isLocal && item.idSender === message.idSender && item.content === message.content,
        );
        if (localIndex >= 0) {
            const next = [...current];
            next[localIndex] = message.withDelivery("sent");
            this.$threadMessages.set(next);
            return;
        }

        this.$threadMessages.set([...current, message]);
    }

    public async markThreadRead(conversationPublicId: string): Promise<void> {
        if (!conversationPublicId) {
            return;
        }

        await firstValueFrom(this.messagesService.markThreadRead(conversationPublicId).pipe(catchError(() => of(0))));

        this.conversations.set(
            this.conversations.value().map((conversation) =>
                conversation.publicId === conversationPublicId ? conversation.withUnreadCount(0) : conversation,
            ),
        );
    }

    public async send(conversationPublicId: string, content: string, parentPublicId?: string | null): Promise<void> {
        const trimmed = content.trim();
        if (!trimmed || !conversationPublicId) {
            return;
        }

        const local = this.buildOutgoing(conversationPublicId, trimmed, parentPublicId, "pending");
        if (!local) {
            return;
        }

        this.appendLocal(local);
        await this.deliver(local);
    }

    public async retry(message: DirectMessage): Promise<void> {
        if (message.delivery !== "failed") {
            return;
        }
        this.replaceInThread(message.publicId, message.withDelivery("pending"));
        await this.deliver(message.withDelivery("pending"));
    }

    private async deliver(local: DirectMessage): Promise<void> {
        this.$sending.set(true);
        try {
            const created = await firstValueFrom(
                this.messagesService.create(local.conversationPublicId, local.content, local.parentPublicId),
            );
            const publicId = MessagesStore.readCreatedPublicId(created);
            if (!publicId) {
                this.replaceInThread(local.publicId, local.withDelivery("failed"));
                return;
            }
            this.replaceInThread(local.publicId, local.withPublicId(publicId).withDelivery("sent"));
        } catch {
            this.replaceInThread(local.publicId, local.withDelivery("failed"));
        } finally {
            this.$sending.set(false);
        }
    }

    private buildOutgoing(
        conversationPublicId: string,
        content: string,
        parentPublicId: string | null | undefined,
        delivery: "pending" | "failed",
    ): DirectMessage | null {
        const me = this.usersStore.user();
        if (!me) {
            return null;
        }
        const parent = parentPublicId
            ? this.$threadMessages().find((item) => item.publicId === parentPublicId)
            : undefined;
        return new DirectMessage(
            `local:${crypto.randomUUID()}`,
            conversationPublicId,
            content,
            me.id,
            me.publicId,
            me.nickname,
            me.discriminator,
            me.avatarUrl,
            new Date(),
            parentPublicId ?? null,
            parent?.content ?? null,
            "text",
            delivery,
        );
    }

    private appendLocal(message: DirectMessage): void {
        this.$threadMessages.set([...this.$threadMessages(), message]);
        this.upsertConversationPreview(message);
    }

    private replaceInThread(publicId: string, next: DirectMessage): void {
        this.$threadMessages.set(
            this.$threadMessages().map((item) => (item.publicId === publicId ? next : item)),
        );
    }

    private unmatchedLocals(server: DirectMessage[], locals: DirectMessage[]): DirectMessage[] {
        return locals.filter(
            (local) => !server.some((item) => item.idSender === local.idSender && item.content === local.content),
        );
    }

    private upsertConversationPreview(message: DirectMessage): void {
        const me = Number(this.usersStore.user()?.id);
        if (!me) {
            return;
        }

        const current = this.conversations.value();
        const index = current.findIndex((item) => item.publicId === message.conversationPublicId);
        const incomingForMe = message.idSender !== me;
        const viewing = this.$threadConversationPublicId() === message.conversationPublicId;

        if (index < 0) {
            this.conversations.reload();
            return;
        }

        const previous = current[index];
        let unreadCount = previous.unreadCount || 0;
        if (incomingForMe && !viewing && !message.isSystem) {
            unreadCount += 1;
        } else if (viewing) {
            unreadCount = 0;
        }

        const next = [...current];
        next.splice(index, 1);
        this.conversations.set([previous.withPreview(message.content, message.creationDate).withUnreadCount(unreadCount), ...next]);
    }

    private static readCreatedPublicId(value: unknown): string {
        if (typeof value === "string") {
            const trimmed = value.replace(/^"|"$/g, "").trim();
            return trimmed && trimmed !== "undefined" ? trimmed : "";
        }
        if (value && typeof value === "object" && "publicId" in value) {
            return MessagesStore.readCreatedPublicId((value as { publicId: unknown }).publicId);
        }
        return "";
    }
}
