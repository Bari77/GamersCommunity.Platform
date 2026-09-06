import { inject, Injectable, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { NbAclService } from "@nebular/security";
import { GameRoleAssignment, toAclRoles } from "@core/security/acl-roles.util";

@Injectable({ providedIn: "root" })
export class PermissionsService {
    private readonly acl = inject(NbAclService);
    private readonly $roles = signal<string[]>([]);

    public readonly roles = this.$roles.asReadonly();
    public readonly roles$ = toObservable(this.$roles);

    public applyFromSession(siteRoles: string[], gameRoles: GameRoleAssignment[]): void {
        this.$roles.set(toAclRoles(siteRoles, gameRoles));
    }

    public clear(): void {
        this.$roles.set([]);
    }

    public can(permission: string, resource: string): boolean {
        return this.$roles().some((role) => this.acl.can(role, permission, resource));
    }

    public isStaff(): boolean {
        return this.can("view", "moderation");
    }

    public isAdmin(): boolean {
        return this.$roles().includes("admin");
    }

    public canBan(): boolean {
        return this.isAdmin();
    }

    public canManageRanks(): boolean {
        return this.isAdmin();
    }
}
