import { Component, OnInit, inject } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { UsersStore } from "@features/users/stores/users.store";
import { NbAuthOAuth2JWTToken, NbAuthResult, NbAuthService } from "@nebular/auth";
import { NbCardModule, NbSpinnerModule } from "@nebular/theme";
import { take } from "rxjs";

const exchangedCodes = new Set<string>();

@Component({
    standalone: true,
    imports: [NbCardModule, NbSpinnerModule],
    templateUrl: "./callback.component.html",
    styleUrls: ["./callback.component.scss"],
})
export class CallbackComponent implements OnInit {
    private auth = inject(NbAuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private usersStore = inject(UsersStore);

    public ngOnInit(): void {
        const code = this.route.snapshot.queryParamMap.get("code");
        if (!code) {
            this.router.navigateByUrl("/users/login");
            return;
        }

        // Auth code is single-use; remounting this page (e.g. global loader
        // destroying router-outlet) must not POST /token/ again.
        if (exchangedCodes.has(code)) {
            return;
        }
        exchangedCodes.add(code);

        this.auth
            .authenticate("authentik")
            .pipe(take(1))
            .subscribe((result: NbAuthResult) => {
                if (result.isSuccess()) {
                    const token = result.getToken() as NbAuthOAuth2JWTToken;
                    this.usersStore.loadUserFromPayload(token.getAccessTokenPayload()).subscribe({
                        next: () => {
                            const redirect = result.getRedirect() || "/home";
                            this.router.navigateByUrl(redirect);
                        },
                        error: () => this.router.navigateByUrl("/users/login"),
                    });
                } else {
                    exchangedCodes.delete(code);
                    this.router.navigateByUrl("/users/login");
                }
            });
    }
}
