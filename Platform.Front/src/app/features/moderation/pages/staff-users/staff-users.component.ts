import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { NbButtonModule, NbInputModule, NbSelectModule } from "@nebular/theme";
import { SkeletonComponent } from "@bari77/gc-ui";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { ModerationNavComponent } from "../../components/moderation-nav/moderation-nav.component";
import { StaffUsersStore } from "../../stores/staff-users.store";

@Component({
    standalone: true,
    selector: "app-staff-users",
    imports: [
        FormsModule,
        DatePipe,
        NbButtonModule,
        NbInputModule,
        NbSelectModule,
        SkeletonComponent,
        UserHandleComponent,
        ModerationNavComponent,
    ],
    templateUrl: "./staff-users.component.html",
    styleUrl: "./staff-users.component.scss",
})
export class StaffUsersComponent {
    public readonly rowPlaceholders = [0, 1, 2, 3, 4];
    public readonly store = inject(StaffUsersStore);

    public query = this.store.query();
    public siteRole = this.store.siteRole();
    public sanction = this.store.sanction();

    private readonly router = inject(Router);

    private queryTimer: ReturnType<typeof setTimeout> | null = null;

    public constructor() {
        void this.store.reload();
    }

    public onQueryChange(value: string): void {
        this.query = value;
        if (this.queryTimer != null) {
            clearTimeout(this.queryTimer);
        }
        this.queryTimer = setTimeout(() => void this.applyFilters(), 350);
    }

    public onSiteRoleChange(value: string): void {
        this.siteRole = value;
        void this.applyFilters();
    }

    public onSanctionChange(value: string): void {
        this.sanction = value;
        void this.applyFilters();
    }

    public open(publicId: string): void {
        void this.router.navigate(["/moderation/users", publicId]);
    }

    private async applyFilters(): Promise<void> {
        this.store.setQuery(this.query);
        this.store.setSiteRole(this.siteRole);
        this.store.setSanction(this.sanction);
        await this.store.reload();
    }
}
