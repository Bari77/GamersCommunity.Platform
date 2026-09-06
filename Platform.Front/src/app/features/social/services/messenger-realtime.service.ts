import { computed, effect, inject, Injectable, Injector, NgZone, signal } from "@angular/core";
import { NotificationDto } from "@features/notifications/dto/notification.dto";
import { AppNotification } from "@features/notifications/models/notification.model";
import { NotificationsStore } from "@features/notifications/stores/notifications.store";
import { ModerationReportsBadgeStore } from "@features/moderation/stores/moderation-reports-badge.store";
import { UsersStore } from "@features/users/stores/users.store";
import { NbAuthOAuth2JWTToken, NbAuthService } from "@nebular/auth";
import * as signalR from "@microsoft/signalr";
import { environment } from "environments/environment";
import { firstValueFrom, map } from "rxjs";
import { MessageDto } from "../dto/message.dto";
import { DirectMessage } from "../models/message.model";
import { FriendsStore } from "../stores/friends.store";
import { FriendUpdatedPayload, MessengerStore } from "../stores/messenger.store";
import { MessagesStore } from "../stores/messages.store";

export type MessengerRealtimeStatus = "offline" | "connecting" | "connected";

const RECONNECT_DELAYS_MS = [0, 2_000, 5_000, 10_000, 30_000];
const RETRY_CAP_MS = 30_000;

@Injectable({ providedIn: "root" })
export class MessengerRealtimeService {
    public readonly status = computed(() => this.$status());
    public readonly isLive = computed(() => this.$status() === "connected");
    public readonly isConnecting = computed(() => this.$status() === "connecting");

    public readonly offlineMessage = computed(() => {
        switch (this.$status()) {
            case "connecting":
                return $localize`:@@social.messenger.realtime.connecting:Connecting to live whispers…`;
            case "offline":
                return $localize`:@@social.messenger.realtime.offline:Live whispers are unavailable. Sending is disabled until the link is restored.`;
            default:
                return "";
        }
    });

    private readonly authService = inject(NbAuthService);
    private readonly usersStore = inject(UsersStore);
    private readonly messagesStore = inject(MessagesStore);
    private readonly friendsStore = inject(FriendsStore);
    private readonly notificationsStore = inject(NotificationsStore);
    private readonly reportsBadgeStore = inject(ModerationReportsBadgeStore);
    private readonly injector = inject(Injector);
    private readonly zone = inject(NgZone);

    private readonly $status = signal<MessengerRealtimeStatus>("offline");
    private connection: signalR.HubConnection | null = null;
    private starting = false;
    private wantConnected = false;
    private retryAttempt = 0;
    private retryTimer: ReturnType<typeof setTimeout> | null = null;

    public constructor() {
        effect(() => {
            if (this.usersStore.isLoggedIn()) {
                this.wantConnected = true;
                void this.connect();
            } else {
                void this.disconnect();
            }
        });
    }

    public async connect(): Promise<void> {
        if (!environment.hubUrl || !this.wantConnected) {
            this.$status.set("offline");
            return;
        }
        if (this.starting || this.connection?.state === signalR.HubConnectionState.Connected) {
            return;
        }

        this.clearRetryTimer();
        this.starting = true;
        this.$status.set("connecting");
        try {
            await this.teardownConnection();

            this.connection = new signalR.HubConnectionBuilder()
                .withUrl(environment.hubUrl, {
                    accessTokenFactory: () => this.resolveAccessToken(),
                })
                .withAutomaticReconnect(RECONNECT_DELAYS_MS)
                .build();

            this.connection.on("message.created", (payload: MessageDto) => {
                this.zone.run(() => {
                    let message: DirectMessage;
                    try {
                        message = DirectMessage.fromDto(payload);
                    } catch {
                        this.messagesStore.reload();
                        return;
                    }
                    if (!message.conversationPublicId) {
                        this.messagesStore.reload();
                        return;
                    }
                    this.messagesStore.upsert(message);

                    const me = Number(this.usersStore.user()?.id);
                    const messenger = this.injector.get(MessengerStore);
                    if (
                        me &&
                        message.idSender !== me &&
                        messenger.selectedConversationPublicId() === message.conversationPublicId
                    ) {
                        void this.messagesStore.markThreadRead(message.conversationPublicId);
                    }
                });
            });

            this.connection.on("conversation.updated", (payload: { publicId?: string; deleted?: boolean }) => {
                this.zone.run(() => {
                    const publicId = payload?.publicId;
                    if (!publicId) {
                        this.messagesStore.reload();
                        return;
                    }
                    this.injector.get(MessengerStore).handleConversationUpdated(publicId, !!payload.deleted);
                });
            });

            this.connection.on("friend.updated", (_payload: FriendUpdatedPayload) => {
                this.zone.run(() => {
                    this.friendsStore.reload();
                });
            });

            this.connection.on("notification.created", (payload: NotificationDto) => {
                this.zone.run(() => {
                    this.notificationsStore.upsert(AppNotification.fromDto(payload));
                });
            });

            this.connection.on("report.queue.updated", (payload: { openCount?: number }) => {
                this.zone.run(() => {
                    if (typeof payload?.openCount === "number") {
                        this.reportsBadgeStore.setOpenCount(payload.openCount);
                    } else {
                        void this.reportsBadgeStore.reload();
                    }
                });
            });

            this.connection.onreconnecting(() => {
                this.zone.run(() => this.$status.set("connecting"));
            });
            this.connection.onreconnected(() => {
                this.zone.run(() => {
                    this.retryAttempt = 0;
                    this.$status.set("connected");
                    this.messagesStore.reload();
                    this.friendsStore.reload();
                    this.notificationsStore.reload();
                    void this.reportsBadgeStore.reload();
                });
            });
            this.connection.onclose(() => {
                this.zone.run(() => {
                    this.$status.set("offline");
                    this.scheduleRetry();
                });
            });

            await this.connection.start();
            this.retryAttempt = 0;
            this.$status.set("connected");
        } catch {
            this.$status.set("offline");
            await this.teardownConnection();
            this.scheduleRetry();
        } finally {
            this.starting = false;
        }
    }

    public async disconnect(): Promise<void> {
        this.wantConnected = false;
        this.clearRetryTimer();
        this.retryAttempt = 0;
        await this.teardownConnection();
        this.$status.set("offline");
    }

    private scheduleRetry(): void {
        if (!this.wantConnected || !environment.hubUrl || this.retryTimer != null) {
            return;
        }

        const delay = Math.min(
            RECONNECT_DELAYS_MS[Math.min(this.retryAttempt, RECONNECT_DELAYS_MS.length - 1)] ?? RETRY_CAP_MS,
            RETRY_CAP_MS,
        );
        this.retryAttempt += 1;
        this.$status.set("connecting");

        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            void this.connect();
        }, delay);
    }

    private clearRetryTimer(): void {
        if (this.retryTimer == null) {
            return;
        }
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
    }

    private async teardownConnection(): Promise<void> {
        const connection = this.connection;
        this.connection = null;
        if (!connection) {
            return;
        }

        connection.off("message.created");
        connection.off("conversation.updated");
        connection.off("friend.updated");
        connection.off("notification.created");
        connection.off("report.queue.updated");
        try {
            await connection.stop();
        } catch {
            /* ignore stop errors during teardown */
        }
    }

    private async resolveAccessToken(): Promise<string> {
        const token = await firstValueFrom(
            this.authService.getToken().pipe(map((t) => t as NbAuthOAuth2JWTToken)),
        );
        return token?.getValue() ?? "";
    }
}
