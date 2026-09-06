import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { NbToastrService } from "@nebular/theme";
import { catchError, throwError } from "rxjs";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const toastr = inject(NbToastrService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // OAuth token errors are handled by the auth callback; avoid a misleading "Invalid data" toast.
            if (req.url.includes("/application/o/token")) {
                return throwError(() => error);
            }

            let msg = $localize`:@@error.httpCode.internalErrorMsg:An error occurred while processing your request. Please try again or contact an administrator.`;
            let title = $localize`:@@error.httpCode.internalErrorTitle:Error`;

            if (error.status === 0 || error.status === 504) {
                msg = $localize`:@@error.httpCode.offlineMsg:The site is currently unavailable.`;
                title = $localize`:@@error.httpCode.offlineTitle:Network error`;
                toastr.danger(msg, title, { duration: 0 });
                router.navigate(["/offline"]);
                return throwError(() => error);
            }

            switch (error.status) {
                case 400:
                    if (error.error?.Code === "BANNED") {
                        msg = $localize`:@@error.httpCode.banned:This account is banned.`;
                        title = $localize`:@@error.httpCode.bannedTitle:Account banned`;
                        break;
                    }
                    msg = $localize`:@@error.httpCode.badRequest:Please correct the data before sending it.`;
                    title = $localize`:@@error.httpCode.badRequestTitle:Incorrect data`;
                    break;

                case 401:
                    msg = $localize`:@@error.httpCode.unauthorizedMsg:Please log in again.`;
                    title = $localize`:@@error.httpCode.unauthorizedTitle:Session expired`;
                    router.navigate(["users/login"]);
                    break;

                case 403:
                    msg = $localize`:@@error.httpCode.forbiddenMsg:You do not have the necessary authorizations.`;
                    title = $localize`:@@error.httpCode.forbiddenTitle:Access denied`;
                    break;

                case 404:
                    msg = $localize`:@@error.httpCode.notFound:The requested resource could not be found.`;
                    title = $localize`:@@error.httpCode.notFoundTitle:Not found`;
                    break;
            }

            if (error.status < 500) {
                toastr.warning(msg, title);
            } else if (error.error.Code !== "NICKNAME_MANDATORY") {
                toastr.danger(msg, title);
            }

            return throwError(() => error);
        }),
    );
};
