import { DatePipe } from "@angular/common";
import { Component, computed, HostListener, inject, OnInit, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbChatModule, NbIconModule, NbSpinnerModule } from "@nebular/theme";
import { MessengerStore } from "../../stores/messenger.store";

const FAB_SIZE = 64;
const FAB_STORAGE_KEY = "gc.messenger.fab";
const DRAG_THRESHOLD_PX = 6;

@Component({
    standalone: true,
    selector: "app-messenger-dock",
    imports: [NbButtonModule, NbIconModule, NbChatModule, NbSpinnerModule, DatePipe],
    templateUrl: "./messenger-dock.component.html",
    styleUrl: "./messenger-dock.component.scss",
})
export class MessengerDockComponent implements OnInit {
    public readonly usersStore = inject(UsersStore);
    public readonly messengerStore = inject(MessengerStore);
    public readonly now = new Date();
    public readonly youLabel = $localize`:@@social.messenger.you:You`;

    public readonly fabX = signal(0);
    public readonly fabY = signal(0);
    public readonly isDragging = signal(false);

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

    private dragOriginX = 0;
    private dragOriginY = 0;
    private pointerOriginX = 0;
    private pointerOriginY = 0;
    private dragMoved = false;
    private activePointerId: number | null = null;

    @HostListener("window:resize")
    public onResize(): void {
        this.fabX.set(this.clampX(this.fabX()));
        this.fabY.set(this.clampY(this.fabY()));
    }

    public ngOnInit(): void {
        this.restoreFabPosition();
    }

    public onSend(event: { message: string; files: File[] }): void {
        void this.messengerStore.send(event.message);
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
