import { DatePipe } from "@angular/common";
import {
    afterRenderEffect,
    Component,
    computed,
    ElementRef,
    HostListener,
    inject,
    OnDestroy,
    OnInit,
    signal,
    viewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { UsersStore } from "@features/users/stores/users.store";
import {
    NbButtonModule,
    NbChatModule,
    NbDialogService,
    NbIconModule,
    NbSpinnerModule,
    NbTooltipModule,
} from "@nebular/theme";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { CreateGroupDialogComponent } from "../create-group-dialog/create-group-dialog.component";
import { ManageGroupDialogComponent } from "../manage-group-dialog/manage-group-dialog.component";
import { DirectMessage } from "../../models/message.model";
import { MessengerStore } from "../../stores/messenger.store";

const FAB_SIZE = 64;
const FAB_STORAGE_KEY = "gc.messenger.fab";
const DRAG_THRESHOLD_PX = 6;
const NEAR_BOTTOM_PX = 72;
const NEAR_TOP_PX = 48;

@Component({
    standalone: true,
    selector: "app-messenger-dock",
    imports: [NbButtonModule, NbIconModule, NbSpinnerModule, NbChatModule, NbTooltipModule, DatePipe, UserHandleComponent],
    templateUrl: "./messenger-dock.component.html",
    styleUrl: "./messenger-dock.component.scss",
})
export class MessengerDockComponent implements OnInit, OnDestroy {
    public readonly usersStore = inject(UsersStore);
    public readonly messengerStore = inject(MessengerStore);
    public readonly newMessagesLabel = $localize`:@@social.messenger.newMessages:New messages`;
    public readonly composePlaceholder = $localize`:@@social.messenger.compose:Whisper something…`;
    public readonly cancelReplyLabel = $localize`:@@social.messenger.cancelReply:Cancel reply`;
    public readonly retryLabel = $localize`:@@social.messenger.retry:Retry`;
    public readonly replyingTo = signal<DirectMessage | null>(null);

    public readonly fabX = signal(0);
    public readonly fabY = signal(0);
    public readonly isDragging = signal(false);
    public readonly pendingBelowCount = signal(0);
    public readonly stickToBottom = signal(true);

    public readonly panelStyle = computed(() => {
        const fabLeft = this.fabX();
        const fabTop = this.fabY();
        const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
        const vh = typeof window === "undefined" ? 800 : window.innerHeight;
        const panelW = Math.min(360, vw - 24);
        const panelH = Math.min(560, vh - 48);
        const gap = 14;

        let left = fabLeft - panelW - gap;
        if (left < 12) {
            left = fabLeft + FAB_SIZE + gap;
        }
        left = Math.min(Math.max(12, left), vw - panelW - 12);

        let top = fabTop + FAB_SIZE - panelH;
        if (top < 12) {
            top = fabTop + FAB_SIZE + gap;
        }
        top = Math.min(Math.max(12, top), vh - panelH - 12);

        return {
            left: `${left}px`,
            top: `${top}px`,
            width: `${panelW}px`,
            height: `${panelH}px`,
        };
    });

    private readonly router = inject(Router);
    private readonly dialogService = inject(NbDialogService);
    private readonly whisperScroll = viewChild<ElementRef<HTMLElement>>("whisperScroll");
    private dragOriginX = 0;
    private dragOriginY = 0;
    private pointerOriginX = 0;
    private pointerOriginY = 0;
    private dragMoved = false;
    private activePointerId: number | null = null;
    private lastThreadPublicId: string | null = null;
    private lastTailPublicId: string | null = null;
    private loadingOlder = false;
    private boundScrollEl: HTMLElement | null = null;
    private readonly handleChatScroll = (): void => {
        this.onMessagesScroll();
    };

    public constructor() {
        afterRenderEffect(() => {
            this.bindChatScroll();
            const conversationPublicId = this.messengerStore.selectedConversationPublicId();
            const messages = this.messengerStore.threadMessages();
            const loading = this.messengerStore.messagesLoading();
            const tailPublicId = messages.at(-1)?.publicId ?? null;

            if (conversationPublicId !== this.lastThreadPublicId) {
                this.lastThreadPublicId = conversationPublicId;
                this.lastTailPublicId = null;
                this.pendingBelowCount.set(0);
                this.stickToBottom.set(true);
                this.replyingTo.set(null);
                if (conversationPublicId != null && !loading && messages.length > 0) {
                    this.lastTailPublicId = tailPublicId;
                    this.scrollToBottom(false);
                }
                return;
            }

            if (loading || conversationPublicId == null) {
                return;
            }

            if (tailPublicId == null || tailPublicId === this.lastTailPublicId) {
                if (messages.length > 0 && this.lastTailPublicId == null) {
                    this.lastTailPublicId = tailPublicId;
                    this.scrollToBottom(false);
                }
                return;
            }

            const isInitialPin = this.lastTailPublicId == null;
            this.lastTailPublicId = tailPublicId;
            if (this.stickToBottom()) {
                this.pendingBelowCount.set(0);
                this.scrollToBottom(!isInitialPin);
                return;
            }

            this.pendingBelowCount.update((count) => count + 1);
        });
    }

    @HostListener("window:resize")
    public onResize(): void {
        this.fabX.set(this.clampX(this.fabX()));
        this.fabY.set(this.clampY(this.fabY()));
    }

    public ngOnInit(): void {
        this.restoreFabPosition();
    }

    public ngOnDestroy(): void {
        this.boundScrollEl?.removeEventListener("scroll", this.handleChatScroll);
    }

    public messageHandle(message: DirectMessage): string {
        const isMine = message.idSender === this.usersStore.user()?.id;
        const nickname = isMine
            ? (this.usersStore.user()?.nickname ?? message.senderNickname)
            : message.senderNickname || this.messengerStore.selectedNickname();
        const discriminator = isMine
            ? (this.usersStore.user()?.discriminator ?? message.senderDiscriminator)
            : message.senderDiscriminator || this.messengerStore.selectedDiscriminator();
        const normalized = (discriminator ?? "").replace(/^#/, "").trim();
        return normalized ? `${nickname}#${normalized}` : nickname;
    }

    public onMessageClick(event: MouseEvent, message: DirectMessage): void {
        const target = event.target as HTMLElement | null;
        if (target?.closest(".sender")) {
            this.openSenderProfile(message);
            return;
        }
        if (message.delivery === "failed") {
            this.retryMessage(event, message);
            return;
        }
        if (message.isSystem || message.isLocal) {
            return;
        }
        this.startReply(message);
    }

    public messageAvatar(message: DirectMessage): string {
        if (message.idSender === this.usersStore.user()?.id) {
            return this.usersStore.user()?.avatarUrl ?? "";
        }
        return message.senderAvatarUrl || this.messengerStore.selectedPeerAvatarUrl();
    }

    public openSenderProfile(message: DirectMessage): void {
        const publicId =
            message.idSender === this.usersStore.user()?.id
                ? this.usersStore.user()?.publicId
                : message.senderPublicId;
        if (publicId) {
            this.openPeerProfile(publicId);
        }
    }

    public openCreateGroup(): void {
        this.dialogService.open(CreateGroupDialogComponent).onClose.subscribe((result) => {
            if (!result?.memberIds?.length) {
                return;
            }
            void this.messengerStore.createGroup(result.memberIds, result.title, result.avatarId);
        });
    }

    public openManageGroup(): void {
        const conversation = this.messengerStore.selectedConversation();
        if (!conversation?.isGroup) {
            return;
        }
        const ref = this.dialogService.open(ManageGroupDialogComponent, {
            context: { initial: conversation },
        });
        ref.onClose.subscribe((result) => {
            if (result?.openProfile) {
                this.openPeerProfile(result.openProfile);
            }
        });
    }

    public messageQuote(message: DirectMessage): string {
        return message.parentContent ?? "";
    }

    public eventLabel(message: DirectMessage): string {
        const handle = this.messageHandle(message);
        if (message.kind === "member_left") {
            return $localize`:@@social.messenger.event.left:${handle}:handle: left the group.`;
        }
        return $localize`:@@social.messenger.event.joined:${handle}:handle: joined the group.`;
    }

    public onMessagesScroll(): void {
        const el = this.chatScrollEl();
        if (!el) {
            return;
        }

        const distanceBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const nearBottom = distanceBottom <= NEAR_BOTTOM_PX;
        this.stickToBottom.set(nearBottom);
        if (nearBottom) {
            this.pendingBelowCount.set(0);
        }

        if (el.scrollTop <= NEAR_TOP_PX) {
            void this.tryLoadOlder(el);
        }
    }

    public jumpToLatest(): void {
        this.pendingBelowCount.set(0);
        this.stickToBottom.set(true);
        this.scrollToBottom(true);
    }

    public onChatSend(event: { message: string; files: File[] }): void {
        const content = event.message.trim();
        if (!content) {
            return;
        }
        const parentPublicId = this.replyingTo()?.publicId ?? null;
        this.replyingTo.set(null);
        this.stickToBottom.set(true);
        this.pendingBelowCount.set(0);
        void this.messengerStore.send(content, parentPublicId);
        this.scrollToBottom(true);
    }

    public startReply(message: DirectMessage): void {
        if (!this.messengerStore.canCompose() || message.isLocal || message.isSystem) {
            return;
        }
        this.replyingTo.update((current) => (current?.publicId === message.publicId ? null : message));
    }

    public retryMessage(event: MouseEvent, message: DirectMessage): void {
        event.preventDefault();
        event.stopPropagation();
        void this.messengerStore.retry(message);
    }

    public cancelReply(): void {
        this.replyingTo.set(null);
    }

    public onFabPointerDown(event: PointerEvent): void {
        if (event.button !== 0) {
            return;
        }
        this.activePointerId = event.pointerId;
        this.dragMoved = false;
        this.dragOriginX = this.fabX();
        this.dragOriginY = this.fabY();
        this.pointerOriginX = event.clientX;
        this.pointerOriginY = event.clientY;
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    public onFabPointerMove(event: PointerEvent): void {
        if (this.activePointerId !== event.pointerId) {
            return;
        }

        const dx = event.clientX - this.pointerOriginX;
        const dy = event.clientY - this.pointerOriginY;
        if (!this.dragMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
            return;
        }

        this.dragMoved = true;
        this.isDragging.set(true);
        this.fabX.set(this.clampX(this.dragOriginX + dx));
        this.fabY.set(this.clampY(this.dragOriginY + dy));
    }

    public onFabPointerUp(event: PointerEvent): void {
        if (this.activePointerId !== event.pointerId) {
            return;
        }

        const wasDragging = this.dragMoved;
        this.activePointerId = null;
        this.isDragging.set(false);

        if (wasDragging) {
            this.persistFabPosition();
            return;
        }

        this.messengerStore.toggle();
    }

    public openPeerProfile(publicId: string): void {
        if (!publicId) {
            return;
        }
        void this.router.navigate(["/users", publicId]);
        this.messengerStore.close();
    }

    private async tryLoadOlder(el: HTMLElement): Promise<void> {
        if (this.loadingOlder || !this.messengerStore.threadHasMore() || this.messengerStore.threadLoadingOlder()) {
            return;
        }

        this.loadingOlder = true;
        const previousHeight = el.scrollHeight;
        const previousTop = el.scrollTop;
        try {
            const loaded = await this.messengerStore.loadOlderMessages();
            if (!loaded) {
                return;
            }
            queueMicrotask(() => {
                const next = this.chatScrollEl();
                if (!next) {
                    return;
                }
                next.scrollTop = previousTop + (next.scrollHeight - previousHeight);
            });
        } finally {
            this.loadingOlder = false;
        }
    }

    private bindChatScroll(): void {
        const el = this.chatScrollEl();
        if (!el || el === this.boundScrollEl) {
            return;
        }
        this.boundScrollEl?.removeEventListener("scroll", this.handleChatScroll);
        this.boundScrollEl = el;
        el.addEventListener("scroll", this.handleChatScroll);
    }

    private chatScrollEl(): HTMLElement | undefined {
        return this.whisperScroll()?.nativeElement;
    }

    private scrollToBottom(smooth: boolean): void {
        const el = this.chatScrollEl();
        if (!el) {
            return;
        }
        if (smooth) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: "smooth",
            });
            return;
        }
        el.scrollTop = el.scrollHeight;
        requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
        });
    }

    private restoreFabPosition(): void {
        try {
            const raw = localStorage.getItem(FAB_STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as { x?: number; y?: number };
                if (typeof parsed.x === "number" && typeof parsed.y === "number") {
                    this.fabX.set(this.clampX(parsed.x));
                    this.fabY.set(this.clampY(parsed.y));
                    return;
                }
            }
        } catch {
            /* ignore corrupt storage */
        }

        this.fabX.set(this.clampX(window.innerWidth - FAB_SIZE - 20));
        this.fabY.set(this.clampY(window.innerHeight - FAB_SIZE - 76));
    }

    private persistFabPosition(): void {
        localStorage.setItem(FAB_STORAGE_KEY, JSON.stringify({ x: this.fabX(), y: this.fabY() }));
    }

    private clampX(x: number): number {
        return Math.min(Math.max(8, x), window.innerWidth - FAB_SIZE - 8);
    }

    private clampY(y: number): number {
        return Math.min(Math.max(8, y), window.innerHeight - FAB_SIZE - 8);
    }
}
