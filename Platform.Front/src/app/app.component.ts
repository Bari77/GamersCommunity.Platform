import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ContextBarComponent } from "@core/layout/context-bar/context-bar.component";
import { FooterComponent } from "@core/layout/footer/components/footer/footer.component";
import { HeaderComponent } from "@core/layout/header/components/header/header.component";
import { MuteBannerComponent } from "@features/moderation/components/mute-banner/mute-banner.component";
import { MessengerDockComponent } from "@features/social/components/messenger-dock/messenger-dock.component";
import { MessengerRealtimeService } from "@features/social/services/messenger-realtime.service";
import { PresenceHeartbeatService } from "@features/users/services/presence-heartbeat.service";
import { NbAuthOAuth2JWTToken, NbAuthService } from "@nebular/auth";
import { NbLayoutModule } from "@nebular/theme";
import { firstValueFrom, interval, map } from "rxjs";

@Component({
    standalone: true,
    selector: "app",
    imports: [
        RouterOutlet,
        NbLayoutModule,
        HeaderComponent,
        FooterComponent,
        MessengerDockComponent,
        MuteBannerComponent,
        ContextBarComponent,
    ],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
})
export class AppComponent {
    private readonly authService = inject(NbAuthService);
    private readonly messengerRealtime = inject(MessengerRealtimeService);
    private readonly presenceHeartbeat = inject(PresenceHeartbeatService);

    public constructor() {
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
