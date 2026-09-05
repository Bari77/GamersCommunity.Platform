import { Component, computed, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { FooterComponent } from "@core/layout/footer/components/footer/footer.component";
import { HeaderComponent } from "@core/layout/header/components/header/header.component";
import { LoadingComponent } from "@core/layout/splash/components/loading/loading.component";
import { LoadingStore } from "@core/stores/loading.store";
import { NbAuthOAuth2JWTToken, NbAuthService } from "@nebular/auth";
import { NbLayoutModule } from "@nebular/theme";
import { firstValueFrom, interval, map } from "rxjs";

@Component({
    standalone: true,
    selector: "app",
    imports: [RouterOutlet, NbLayoutModule, HeaderComponent, FooterComponent, LoadingComponent],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {
    private readonly loadingStore = inject(LoadingStore);
    private readonly authService = inject(NbAuthService);

    public readonly isLoading = computed(() => this.loadingStore.loading());
    public readonly loadingMessage = computed(
        () => this.loadingStore.message() ?? $localize`:@@core.layout.loading.message:Loading...`,
    );

    constructor() {
        const refreshSkewMs = 120_000;
        interval(30_000).subscribe(async () => {
            const token = await firstValueFrom(
                this.authService.getToken().pipe(map((t) => t as NbAuthOAuth2JWTToken)),
            );
            if (!token?.getRefreshToken()) {
                return;
            }

            const exp = token.getTokenExpDate();
            const msLeft = exp ? exp.getTime() - Date.now() : Number.POSITIVE_INFINITY;
            if (!token.isValid() || msLeft < refreshSkewMs) {
                this.authService.refreshToken("authentik", token).subscribe();
            }
        });
    }
}
