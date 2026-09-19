import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthTokenService } from "@core/services/auth-token.service";
import { environment } from "environments/environment";
import { switchMap } from "rxjs";

/**
 * Replaces `NbAuthJWTInterceptor`, which refreshes the token once per request instead of sharing a
 * single refresh, and would therefore replay refresh tokens Authentik has already revoked.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
    // IdP calls carry their own credentials, and the refresh call itself must not recurse here.
    if (req.url.startsWith(environment.idpUrl)) {
        return next(req);
    }

    return inject(AuthTokenService)
        .bearerToken()
        .pipe(
            switchMap((bearer) =>
                // Without a session the request goes out anonymous, so the API answers 401/403 and
                // the error interceptor can offer to log in again.
                next(bearer ? req.clone({ setHeaders: { Authorization: `Bearer ${bearer}` } }) : req),
            ),
        );
};
