import { computed, inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { PermissionsService } from "@core/services/permissions.service";
import { NbAuthOAuth2JWTToken, NbAuthService } from "@nebular/auth";
import { NbDialogService, NbMenuItem } from "@nebular/theme";
import { environment } from "environments/environment";
import { finalize, firstValueFrom, map, Observable, Subscriber, throwError } from "rxjs";
import { NicknameDialogComponent } from "../components/nickname-dialog/nickname-dialog.component";
import { LoadRequestDto } from "../dto/load.dto";
import { UpdateUserRequestDto } from "../dto/update-user.dto";
import { User } from "../models/user.model";
import { UsersService } from "../users.service";

@Injectable({ providedIn: "root" })
export class UsersStore {
    public readonly redirectLoading = computed(() => this.$redirectLoading());
    public readonly loading = computed(() => this.$loading());
    public readonly user = computed(() => this.$user());
    public readonly isLoggedIn = computed(() => !!this.$user());
    public readonly discriminator = computed(() => `#${this.$user()?.discriminator}`);
    public readonly fullNickname = computed(() => `${this.$user()?.nickname}#${this.$user()?.discriminator}`);
    public readonly menuItems = computed(() => this.$menuItems());

    private readonly authService = inject(NbAuthService);
    private readonly usersService = inject(UsersService);
    private readonly dialogService = inject(NbDialogService);
    private readonly permissionsService = inject(PermissionsService);
    private readonly router = inject(Router);

    private readonly $redirectLoading = signal<boolean>(false);
    private readonly $loading = signal<boolean>(false);
    private readonly $user = signal<User | null>(null);
    private readonly $menuItems = signal<NbMenuItem[]>(this.getMenuItems());
    private nicknameDialogRef: ReturnType<NbDialogService["open"]> | null = null;

    public constructor() {
        this.authService
            .getToken()
            .pipe(map((token) => token as NbAuthOAuth2JWTToken))
            .subscribe((token: NbAuthOAuth2JWTToken) => {
                if (!token?.isValid()) {
                    this.$user.set(null);
                    return;
                }

                this.loadUserFromPayload(token.getAccessTokenPayload()).subscribe();
            });
    }

    public login(): void {
        this.$loading.set(true);
        this.authService
            .authenticate("authentik")
            .pipe(finalize(() => this.$loading.set(false)))
            .subscribe();
    }

    public signup(): void {
        const enrollment = new URL(`${environment.idpUrl}/if/flow/${environment.idpEnrollmentFlow}/`);
        enrollment.searchParams.set("next", this.buildAuthorizeNextPath());
        location.href = enrollment.toString();
    }

    public signupWithGoogle(): void {
        const google = new URL(`${environment.idpUrl}/source/oauth/login/${environment.idpGoogleSourceSlug}/`);
        google.searchParams.set("next", this.buildAuthorizeNextPath());
        location.href = google.toString();
    }

    public logout(): void {
        this.$loading.set(true);
        this.authService
            .logout("authentik")
            .pipe(finalize(() => this.$loading.set(false)))
            .subscribe({
                next: () => {
                    this.$user.set(null);
                    this.router.navigate(["/home"]);
                },
            });
    }

    public updateUser(data: UpdateUserRequestDto): Observable<User> {
        const publicId = this.$user()?.publicId;
        if (!publicId) {
            return throwError(() => new Error("User not loaded"));
        }

        this.$loading.set(true);
        return this.usersService.update(publicId, data).pipe(
            finalize(() => this.$loading.set(false)),
            map((user) => {
                this.$user.set(user);
                return user;
            }),
        );
    }

    public avatarUrlForId(avatarId: number): string {
        return `${environment.assetsBaseUrl}/Avatars/${avatarId}.png`;
    }

    public listAvatarIds(): number[] {
        const ids: number[] = [];
        for (let id = environment.avatarMinId; id <= environment.avatarMaxId; id++) {
            ids.push(id);
        }
        return ids;
    }

    public loadUserFromPayload(payload: any): Observable<void> {
        return new Observable<void>((sub: Subscriber<void>) => {
            if (!payload?.sub) {
                sub.error("Invalid token or without IdP subject.");
                sub.complete();
                return;
            }

            const data: LoadRequestDto = {
                idKeycloak: payload?.sub,
            };

            this.$loading.set(true);
            this.usersService
                .loadUser(data)
                .pipe(finalize(() => this.$loading.set(false)))
                .subscribe({
                    next: (user) => {
                        this.$user.set(user);
                        sub.next();
                        sub.complete();
                    },
                    error: async (err) => {
                        if (err.error?.Code !== "NICKNAME_MANDATORY") {
                            sub.error(err);
                            sub.complete();
                            return;
                        }

                        data.mail = payload.email;
                        data.nickname = await firstValueFrom(this.promptForNickname());

                        if (!data.nickname) {
                            sub.error(new Error("Nickname required"));
                            sub.complete();
                            return;
                        }

                        this.$loading.set(true);
                        this.usersService
                            .loadUser(data)
                            .pipe(finalize(() => this.$loading.set(false)))
                            .subscribe({
                                next: (user) => {
                                    this.$user.set(user);
                                    sub.next();
                                    sub.complete();
                                },
                                error: (signupErr) => {
                                    console.error("Signup failed:", signupErr);
                                    sub.error(signupErr);
                                    sub.complete();
                                },
                            });
                    },
                });
        });
    }

    private promptForNickname(): Observable<string | undefined> {
        if (this.nicknameDialogRef) {
            return this.nicknameDialogRef.onClose as Observable<string | undefined>;
        }

        this.nicknameDialogRef = this.dialogService.open(NicknameDialogComponent, {
            closeOnBackdropClick: false,
            closeOnEsc: false,
        });

        return (this.nicknameDialogRef.onClose as Observable<string | undefined>).pipe(
            finalize(() => {
                this.nicknameDialogRef = null;
            }),
        );
    }

    private getMenuItems(): NbMenuItem[] {
        const result = [
            {
                data: "profile",
                link: "/users/profile",
                title: $localize`:@@core.header.menu.profile:Profile`,
                icon: "person-outline",
            },
            {
                data: "logout",
                link: "/users/logout",
                title: $localize`:@@core.header.menu.logout:Logout`,
                icon: "power-outline",
            },
        ];

        return result;
    }

    private buildAuthorizeNextPath(): string {
        const params = new URLSearchParams();
        params.set("client_id", environment.idpClientId);
        params.set("redirect_uri", `${location.origin}/auth/callback`);
        params.set("response_type", "code");
        params.set("scope", "openid profile email offline_access");
        return `/application/o/authorize/?${params.toString()}`;
    }
}
