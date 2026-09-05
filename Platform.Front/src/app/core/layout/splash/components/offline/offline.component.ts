import { Component, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { HealthService } from "@core/services/health.service";
import { catchError, interval, of } from "rxjs";
import { SplashComponent } from "../splash/splash.component";

@Component({
    standalone: true,
    selector: "app-offline",
    imports: [SplashComponent],
    templateUrl: "./offline.component.html",
    styleUrls: ["./offline.component.scss"],
})
export class OfflineComponent {
    public readonly refreshInterval = 10;
    public message = computed(() =>
        this.paused()
            ? $localize`:@@core.layout.offline.checking:Checking connection...`
            : $localize`:@@core.layout.offline.message:Site offline — auto refresh in ${this.countdown()}s`,
    );
    public countdown = signal<number>(this.refreshInterval);
    private paused = signal<boolean>(false);
    private healthService = inject(HealthService);
    private router = inject(Router);

    public constructor() {
        this.startCountdown();

        interval(1000)
            .pipe(takeUntilDestroyed())
            .subscribe(() => {
                if (!this.paused() && this.countdown() > 0) {
                    this.countdown.update((v) => v - 1);
                } else if (!this.paused() && this.countdown() === 0) {
                    this.checkConnection();
                }
            });
    }

    private startCountdown(): void {
        this.countdown.set(this.refreshInterval);
    }

    private checkConnection(): void {
        this.paused.set(true);

        this.healthService
            .check()
            .pipe(catchError(() => of(null)))
            .subscribe((res) => {
                if (res) {
                    this.router.navigateByUrl(sessionStorage.getItem("lastUrl") ?? "/");
                } else {
                    this.paused.set(false);
                    this.startCountdown();
                }
            });
    }
}
