import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { AppNotification } from "@features/notifications/models/notification.model";
import { NotificationsStore } from "@features/notifications/stores/notifications.store";
import { NbButtonModule, NbIconModule, NbPopoverModule, NbTooltipModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-notification-bell",
    imports: [NbButtonModule, NbIconModule, NbPopoverModule, NbTooltipModule],
    templateUrl: "./notification-bell.component.html",
    styleUrl: "./notification-bell.component.scss",
})
export class NotificationBellComponent {
    public readonly notificationsStore = inject(NotificationsStore);
    private readonly router = inject(Router);

    public async onItemClick(item: AppNotification): Promise<void> {
        if (!item.isRead) {
            await this.notificationsStore.markRead(item.publicId);
        }
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
}
