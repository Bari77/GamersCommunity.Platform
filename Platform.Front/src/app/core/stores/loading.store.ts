import { Injectable, signal } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LoadingStore {
    public readonly loading = signal(false);
    public readonly message = signal<string | null>(null);

    public show(message?: string): void {
        this.message.set(message ?? null);
        this.loading.set(true);
    }

    public hide(): void {
        this.loading.set(false);
        this.message.set(null);
    }
}
