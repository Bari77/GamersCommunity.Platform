import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { NbButtonModule, NbInputModule, NbSelectModule, NbSpinnerModule } from "@nebular/theme";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { ModerationNavComponent } from "../../components/moderation-nav/moderation-nav.component";
import { StaffUsersStore } from "../../stores/staff-users.store";

@Component({
    standalone: true,
    selector: "app-staff-users",
    imports: [
        FormsModule,
        RouterLink,
        DatePipe,
        NbButtonModule,
        NbInputModule,
        NbSelectModule,
        NbSpinnerModule,
        UserHandleComponent,
        ModerationNavComponent,
    ],
    templateUrl: "./staff-users.component.html",
    styleUrl: "./staff-users.component.scss",
})
export class StaffUsersComponent {
    public readonly store = inject(StaffUsersStore);
    private readonly router = inject(Router);

    public query = this.store.query();
    public siteRole = this.store.siteRole();
    public sanction = this.store.sanction();

    private queryTimer: ReturnType<typeof setTimeout> | null = null;

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

    private async applyFilters(): Promise<void> {
        this.store.setQuery(this.query);
        this.store.setSiteRole(this.siteRole);
        this.store.setSanction(this.sanction);
        await this.store.reload();
    }

    public open(publicId: string): void {
        void this.router.navigate(["/moderation/users", publicId]);
    }
}
