import { inject, Injectable } from "@angular/core";
import { PermissionsService } from "@core/services/permissions.service";
import { NbRoleProvider } from "@nebular/security";
import { Observable } from "rxjs";

@Injectable()
export class RoleService implements NbRoleProvider {
    private readonly permissions = inject(PermissionsService);

    public getRole(): Observable<string[]> {
        return this.permissions.roles$;
    }
}
