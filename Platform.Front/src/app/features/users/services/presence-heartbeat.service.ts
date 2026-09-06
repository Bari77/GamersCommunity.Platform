import { effect, inject, Injectable, OnDestroy } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";

const HEARTBEAT_MS = 60_000;

@Injectable({ providedIn: "root" })
export class PresenceHeartbeatService implements OnDestroy {
    private readonly usersStore = inject(UsersStore);
    private timer: ReturnType<typeof setInterval> | null = null;

    public constructor() {
        effect(() => {
            if (this.usersStore.isLoggedIn()) {
                this.start();
            } else {
                this.stop();
            }
        });
    }

    public ngOnDestroy(): void {
        this.stop();
    }

    private start(): void {
        if (this.timer != null) {
            return;
        }
        void this.touch();
        this.timer = setInterval(() => void this.touch(), HEARTBEAT_MS);
    }

    private stop(): void {
        if (this.timer == null) {
            return;
        }
        clearInterval(this.timer);
        this.timer = null;
    }

    private async touch(): Promise<void> {
        await this.usersStore.refreshSessionFromTouch();
    }
}
