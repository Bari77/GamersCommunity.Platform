import { inject, Injectable } from "@angular/core";
import { NbAuthOAuth2JWTToken, NbAuthService } from "@nebular/auth";
import { catchError, finalize, map, Observable, of, shareReplay, switchMap } from "rxjs";

/**
 * Single entry point for "give me an access token I can send".
 *
 * Authentik rotates refresh tokens and revokes the previous one, so two refreshes running in
 * parallel make the second replay a revoked token and fail with `invalid_grant`, dropping a session
 * that was perfectly valid. Every caller shares the same in-flight refresh instead.
 */
@Injectable({ providedIn: "root" })
export class AuthTokenService {
    private readonly authService = inject(NbAuthService);
    private refresh: Observable<boolean> | null = null;
    private rejectedRefreshToken: string | null = null;

    /** The bearer value to send, or null when the visitor has no usable session. */
    public bearerToken(): Observable<string | null> {
        return this.currentToken().pipe(
            switchMap((token) => {
                if (!token?.getValue()) {
                    return of(null);
                }
                if (token.isValid()) {
                    return of(token.getValue());
                }
                if (!this.isRenewable(token)) {
                    return of(null);
                }

                return this.sharedRefresh(token).pipe(switchMap(() => this.validTokenValue()));
            }),
        );
    }

    /** Renews a token that expired while the app was closed, before anything reads the session. */
    public restoreSession(): Observable<boolean> {
        return this.bearerToken().pipe(map((value) => !!value));
    }

    /**
     * Renews a token that is about to expire, so requests never have to wait on a refresh and the
     * window where several of them would ask for one at once stays closed.
     */
    public refreshBeforeExpiry(skewMs: number): Observable<boolean> {
        return this.currentToken().pipe(
            switchMap((token) => {
                if (!token?.getRefreshToken() || !this.isRenewable(token)) {
                    return of(false);
                }

                const expiry = token.getTokenExpDate();
                const msLeft = expiry ? expiry.getTime() - Date.now() : Number.POSITIVE_INFINITY;
                if (token.isValid() && msLeft >= skewMs) {
                    return of(false);
                }

                return this.sharedRefresh(token);
            }),
        );
    }

    private sharedRefresh(token: NbAuthOAuth2JWTToken): Observable<boolean> {
        const refreshValue = token.getRefreshToken();

        this.refresh ??= this.authService
            .refreshToken(token.getOwnerStrategyName(), token)
            .pipe(
                map((result) => {
                    if (!result.isSuccess()) {
                        this.rememberRejection(refreshValue, result.getResponse());
                    }
                    return result.isSuccess();
                }),
                catchError(() => of(false)),
                finalize(() => (this.refresh = null)),
                shareReplay({ bufferSize: 1, refCount: false }),
            );

        return this.refresh;
    }

    /**
     * A refresh token the IdP has rejected stays rejected, and replaying it would raise a suspicious
     * request event on every later call. A network failure keeps it renewable: the session may well
     * still be alive once connectivity is back.
     */
    private rememberRejection(refreshValue: string, response: unknown): void {
        const status = (response as { status?: number } | null)?.status;
        if (status !== undefined && status >= 400 && status < 500) {
            this.rejectedRefreshToken = refreshValue;
        }
    }

    private isRenewable(token: NbAuthOAuth2JWTToken): boolean {
        return token.getRefreshToken() !== this.rejectedRefreshToken;
    }

    private currentToken(): Observable<NbAuthOAuth2JWTToken> {
        return this.authService.getToken().pipe(map((token) => token as NbAuthOAuth2JWTToken));
    }

    private validTokenValue(): Observable<string | null> {
        return this.currentToken().pipe(map((token) => (token?.isValid() ? token.getValue() : null)));
    }
}
