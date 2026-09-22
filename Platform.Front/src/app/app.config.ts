import {
    ApplicationConfig,
    importProvidersFrom,
    inject,
    provideAppInitializer,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";

import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { AuthGuard } from "@core/guards/auth.guard";
import { UnauthGuard } from "@core/guards/unauth.guard";
import { authTokenInterceptor } from "@core/interceptors/auth-token.interceptor";
import { errorInterceptor } from "@core/interceptors/error.interceptor";
import { accessControlLol } from "@core/security/league-of-legends.security";
import { accessControlWow } from "@core/security/world-of-warcraft.security";
import { AuthTokenService } from "@core/services/auth-token.service";
import { PermissionsService } from "@core/services/permissions.service";
import { RoleService } from "@core/services/role.service";
import {
    NbAuthModule,
    NbAuthOAuth2JWTToken,
    NbOAuth2AuthStrategy,
    NbOAuth2ClientAuthMethod,
    NbOAuth2ResponseType,
} from "@nebular/auth";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import { NbRoleProvider, NbSecurityModule } from "@nebular/security";
import {
    NbButtonModule,
    NbCardModule,
    NbDialogModule,
    NbGlobalPhysicalPosition,
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbMenuModule,
    NbThemeModule,
    NbToastrModule,
    NbChatModule,
    NbSelectModule,
    NbCheckboxModule,
} from "@nebular/theme";
import { environment } from "environments/environment";
import { catchError, firstValueFrom, of, timeout } from "rxjs";
import { appRoutes } from "./app.routes";
import { accessControlGlobal } from "./nebular.security";

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({
            eventCoalescing: true,
        }),
        provideAnimations(),
        provideRouter(appRoutes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([errorInterceptor, authTokenInterceptor])),
        importProvidersFrom(
            // Nebular UI
            NbThemeModule.forRoot({ name: "cosmic" }),
            NbDialogModule.forRoot(),
            NbMenuModule.forRoot(),
            NbToastrModule.forRoot({
                duration: 5000,
                destroyByClick: true,
                position: NbGlobalPhysicalPosition.TOP_RIGHT,
            }),
            NbLayoutModule,
            NbEvaIconsModule,
            NbCardModule,
            NbButtonModule,
            NbInputModule,
            NbIconModule,
            NbChatModule,
            NbSelectModule,
            NbCheckboxModule,

            // Nebular Auth
            NbAuthModule.forRoot({
                strategies: [
                    NbOAuth2AuthStrategy.setup({
                        name: "authentik",
                        baseEndpoint: `${environment.idpUrl}/application/o`,
                        clientId: environment.idpClientId,
                        clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
                        authorize: {
                            endpoint: "/authorize/",
                            redirectUri: `${location.origin}/auth/callback`,
                            responseType: NbOAuth2ResponseType.CODE,
                            scope: "openid profile email offline_access",
                        },
                        token: {
                            endpoint: "/token/",
                            redirectUri: `${location.origin}/auth/callback`,
                            grantType: "authorization_code",
                            class: NbAuthOAuth2JWTToken,
                            requireValidToken: true,
                        },
                        refresh: {
                            endpoint: "/token/",
                            grantType: "refresh_token",
                            requireValidToken: true,
                        },
                        redirect: {
                            success: "/home",
                        },
                    }),
                ],
                forms: {
                    login: {
                        strategy: "authentik",
                        redirectDelay: 0,
                        showMessages: {
                            success: true,
                            error: true,
                        },
                    },
                    register: {
                        strategy: "authentik",
                        redirectDelay: 0,
                    },
                    logout: {
                        strategy: "authentik",
                        redirectDelay: 0,
                    },
                },
            }),

            // Nebular Security
            NbSecurityModule.forRoot({
                accessControl: {
                    ...accessControlGlobal,
                    ...accessControlWow,
                    ...accessControlLol,
                },
            }),
        ),

        { provide: NbRoleProvider, useClass: RoleService },
        PermissionsService,
        AuthGuard,
        UnauthGuard,

        // An access token that expired while the app was closed is still renewable. Renewing it
        // before the first component renders keeps the header, the guards and the federated games on
        // the same session. A slow or unreachable IdP must never hold the bootstrap: the token
        // stream picks up a late refresh on its own.
        provideAppInitializer(() =>
            firstValueFrom(
                inject(AuthTokenService)
                    .restoreSession()
                    .pipe(
                        timeout({ first: 5_000 }),
                        catchError(() => of(false)),
                    ),
            ),
        ),
    ],
};
