import {
    Component,
    ElementRef,
    HostListener,
    inject,
    signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { AppNotification } from "@features/notifications/models/notification.model";
import { NotificationsStore } from "@features/notifications/stores/notifications.store";
import {
    localizeNotificationBody,
    localizeNotificationTitle,
} from "@features/notifications/utils/notification-copy.util";
import { NbButtonModule, NbIconModule, NbTooltipModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-notification-bell",
    imports: [NbButtonModule, NbIconModule, NbTooltipModule],
    templateUrl: "./notification-bell.component.html",
    styleUrl: "./notification-bell.component.scss",
})
export class NotificationBellComponent {
    public readonly notificationsStore = inject(NotificationsStore);
    public readonly isOpen = signal(false);
    public readonly panelTop = signal(0);
    public readonly panelRight = signal(0);

    private readonly router = inject(Router);
    private readonly host = inject(ElementRef<HTMLElement>);

    @HostListener("document:click", ["$event"])
    public onDocumentClick(event: MouseEvent): void {
        if (!this.isOpen()) {
            return;
        }
        const target = event.target as Node | null;
        if (target && !this.host.nativeElement.contains(target)) {
            this.isOpen.set(false);
        }
    }

    @HostListener("document:keydown.escape")
    public onEscape(): void {
        this.isOpen.set(false);
    }

    @HostListener("window:resize")
    public onResize(): void {
        if (this.isOpen()) {
            this.syncPanelPosition();
        }
    }

    public toggle(event: Event): void {
        event.stopPropagation();
        const next = !this.isOpen();
        if (next) {
            this.syncPanelPosition();
        }
        this.isOpen.set(next);
    }

    public titleOf(item: AppNotification): string {
        return localizeNotificationTitle(item);
    }

    public bodyOf(item: AppNotification): string | null {
        return localizeNotificationBody(item);
    }

    public async onItemClick(item: AppNotification): Promise<void> {
        if (!item.isRead) {
            await this.notificationsStore.markRead(item.publicId);
        }
        this.isOpen.set(false);
        if (item.linkUrl) {
            const path = item.linkUrl.startsWith("/") ? item.linkUrl : `/${item.linkUrl}`;
            void this.router.navigateByUrl(path);
        }
    }

    public markAllRead(): void {
        void this.notificationsStore.markAllRead();
    }

    public relativeTime(date: Date): string {
        const diffMs = Date.now() - date.getTime();
        const minute = 60_000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diffMs < minute) {
            return $localize`:@@notifications.time.justNow:Just now`;
        }
        if (diffMs < hour) {
            const mins = Math.floor(diffMs / minute);
            return $localize`:@@notifications.time.minutes:${mins}:mins:m ago`;
        }
        if (diffMs < day) {
            const hours = Math.floor(diffMs / hour);
            return $localize`:@@notifications.time.hours:${hours}:hours:h ago`;
        }
        const days = Math.floor(diffMs / day);
        return $localize`:@@notifications.time.days:${days}:days:d ago`;
    }

    private syncPanelPosition(): void {
        const rect = this.host.nativeElement.getBoundingClientRect();
        this.panelTop.set(Math.round(rect.bottom + 8));
        this.panelRight.set(Math.round(window.innerWidth - rect.right));
    }
}
