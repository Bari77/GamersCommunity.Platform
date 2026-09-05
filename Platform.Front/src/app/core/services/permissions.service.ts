import { inject, Injectable, signal } from "@angular/core";
import { NbAuthService } from "@nebular/auth";
import { NbAclService } from "@nebular/security";
import { environment } from "environments/environment";

@Injectable({ providedIn: "root" })
export class PermissionsService {
    private authService = inject(NbAuthService);
    private acl = inject(NbAclService);

    private roles = signal<string[]>([]);

    constructor() {
        this.authService.getToken().subscribe((token) => {
            if (!token.isValid()) {
                this.roles.set([]);
                return;
            }

            const payload = token.getPayload();
            const roles: string[] = [
                ...(payload.realm_access?.roles ?? []),
                ...(payload.resource_access?.[environment.idpClientId]?.roles ?? []),
            ];

            this.roles.set(roles);
        });
    }

    public can(permission: string, resource: string): boolean {
        return this.roles().some((role) => this.acl.can(role, permission, resource));
    }
}
