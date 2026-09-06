import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { NotificationsStore } from "@features/notifications/stores/notifications.store";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { DirectMessage } from "../models/message.model";
import { MessagesService } from "../services/messages.service";

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
    public readonly unreadCount = computed(() => {
        const me = this.usersStore.user()?.id;
        if (!me) {
            return 0;
        }
        return this.messages.value().filter((message) => message.idReceiver === me && !message.isRead).length;
    });
    public readonly placeholderText = $localize`:@@social.messages.placeholder:Your whispers will appear here.`;

    private readonly $sending = signal(false);
    private readonly messagesService = inject(MessagesService);
    private readonly usersStore = inject(UsersStore);
    private readonly notificationsStore = inject(NotificationsStore);

    public reload(): void {
        if (!this.usersStore.isLoggedIn()) {
            return;
        }
        this.messages.reload();
    }

    public upsert(message: DirectMessage): void {
        const current = this.messages.value();
        if (current.some((item) => item.publicId === message.publicId || item.id === message.id)) {
            return;
        }

        this.messages.set([...current, message]);
    }

    public async markThreadRead(peerId: number): Promise<void> {
        const me = this.usersStore.user()?.id;
        if (!me || peerId <= 0) {
            return;
        }

        const hasUnread = this.messages
            .value()
            .some((message) => message.idReceiver === me && message.idSender === peerId && !message.isRead);
        if (!hasUnread) {
            this.notificationsStore.markMessagePeerRead(peerId);
            return;
        }

        await firstValueFrom(this.messagesService.markThreadRead(peerId));
        this.messages.set(
            this.messages
                .value()
                .map((message) =>
                    message.idReceiver === me && message.idSender === peerId && !message.isRead
                        ? message.withRead(true)
                        : message,
                ),
        );
        this.notificationsStore.markMessagePeerRead(peerId);
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
}
