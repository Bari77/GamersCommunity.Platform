import { computed, inject, Injectable, resource } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { AppNotification } from "../models/notification.model";
import { NotificationsService } from "../services/notifications.service";

@Injectable({ providedIn: "root" })
export class NotificationsStore {
    public readonly notifications = resource({
        params: () => this.usersStore.isLoggedIn(),
        loader: ({ params: loggedIn }) => {
            if (!loggedIn) {
                return Promise.resolve([] as AppNotification[]);
            }
            return firstValueFrom(
                this.notificationsService.list().pipe(catchError(() => of([] as AppNotification[]))),
            );
        },
        defaultValue: [] as AppNotification[],
    });

    public readonly loading = computed(() => this.notifications.isLoading());
    public readonly unreadCount = computed(
        () => this.notifications.value().filter((item) => !item.isRead).length,
    );
    public readonly items = computed(() => this.notifications.value());

    private readonly notificationsService = inject(NotificationsService);
    private readonly usersStore = inject(UsersStore);

    public reload(): void {
        if (!this.usersStore.isLoggedIn()) {
            return;
        }
        this.notifications.reload();
    }

    public upsert(notification: AppNotification): void {
        const current = this.notifications.value();
        if (current.some((item) => item.publicId === notification.publicId || item.id === notification.id)) {
            return;
        }
        this.notifications.set([notification, ...current]);
    }

    public async markRead(publicId: string): Promise<void> {
        await firstValueFrom(this.notificationsService.markRead(publicId));
        this.notifications.set(
            this.notifications.value().map((item) => (item.publicId === publicId ? item.withRead(true) : item)),
        );
    }

    public async markAllRead(): Promise<void> {
        await firstValueFrom(this.notificationsService.markAllRead());
        this.notifications.set(this.notifications.value().map((item) => item.withRead(true)));
    }

    public markMessagePeerRead(peerId: number): void {
        const needle = `"peerId":${peerId}`;
        this.notifications.set(
            this.notifications.value().map((item) => {
                if (item.isRead || item.kind !== "message" || !item.payloadJson?.includes(needle)) {
                    return item;
                }
                return item.withRead(true);
            }),
        );
    }
}
