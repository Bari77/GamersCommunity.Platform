import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ContextBarComponent } from "@core/layout/context-bar/context-bar.component";
import { FooterComponent } from "@core/layout/footer/components/footer/footer.component";
import { HeaderComponent } from "@core/layout/header/components/header/header.component";
import { AuthTokenService } from "@core/services/auth-token.service";
import { MuteBannerComponent } from "@features/moderation/components/mute-banner/mute-banner.component";
import { MessengerDockComponent } from "@features/social/components/messenger-dock/messenger-dock.component";
import { MessengerRealtimeService } from "@features/social/services/messenger-realtime.service";
import { PresenceHeartbeatService } from "@features/users/services/presence-heartbeat.service";
import { NbLayoutModule } from "@nebular/theme";
import { exhaustMap, interval } from "rxjs";

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
    private readonly authToken = inject(AuthTokenService);
    private readonly messengerRealtime = inject(MessengerRealtimeService);
    private readonly presenceHeartbeat = inject(PresenceHeartbeatService);

    public constructor() {
        const refreshSkewMs = 120_000;
        interval(30_000)
            .pipe(exhaustMap(() => this.authToken.refreshBeforeExpiry(refreshSkewMs)))
            .subscribe();
    }
}
