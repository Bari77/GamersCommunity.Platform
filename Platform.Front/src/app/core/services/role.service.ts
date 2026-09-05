import { inject, Injectable } from "@angular/core";
import { NbAuthService, NbAuthToken } from "@nebular/auth";
import { NbRoleProvider } from "@nebular/security";
import { environment } from "environments/environment";
import { map, Observable } from "rxjs";

@Injectable()
export class RoleService implements NbRoleProvider {
    private authService: NbAuthService = inject(NbAuthService);

    public getRole(): Observable<string[]> {
        return this.authService.onTokenChange().pipe(
            map((token: NbAuthToken) => {
                if (!token.isValid()) {
                    return ["guest"];
                }

                const payload = token.getPayload();
                const roles: string[] = [
                    ...(payload.realm_access?.roles ?? []),
                    ...(payload.resource_access?.[environment.idpClientId]?.roles ?? []),
                    ...(Array.isArray(payload.groups) ? payload.groups : []),
                ];

                return roles;
            }),
        );
    }
}
