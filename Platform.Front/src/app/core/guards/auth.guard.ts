import { inject, Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { NbAuthService } from "@nebular/auth";
import { map, Observable } from "rxjs";

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly authService = inject(NbAuthService);
    private readonly router = inject(Router);

    public canActivate(): Observable<boolean> {
        return this.authService.isAuthenticated().pipe(
            map((authenticated) => {
                if (!authenticated) {
                    this.router.navigate(["/users/login"]);
                }
                return authenticated;
            }),
        );
    }
}
