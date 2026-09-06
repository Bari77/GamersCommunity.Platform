import { DatePipe } from "@angular/common";
import { Component, effect, inject } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { PermissionsService } from "@core/services/permissions.service";
import { NbButtonModule, NbDialogService, NbSelectModule, NbSpinnerModule } from "@nebular/theme";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { firstValueFrom } from "rxjs";
import {
    SanctionDialogComponent,
    SanctionDialogResult,
} from "../../components/sanction-dialog/sanction-dialog.component";
import { ModerationNavComponent } from "../../components/moderation-nav/moderation-nav.component";
import { ModerationReport } from "../../models/staff-user.model";
import { SanctionsService } from "../../services/sanctions.service";
import { ReportsStore } from "../../stores/reports.store";
import { ModerationReportsBadgeStore } from "../../stores/moderation-reports-badge.store";

@Component({
    standalone: true,
    selector: "app-staff-reports",
    imports: [DatePipe, RouterLink, NbButtonModule, NbSelectModule, NbSpinnerModule, UserHandleComponent, ModerationNavComponent],
    templateUrl: "./staff-reports.component.html",
    styleUrl: "./staff-reports.component.scss",
})
export class StaffReportsComponent {
    public readonly store = inject(ReportsStore);
    public readonly permissions = inject(PermissionsService);
    private readonly reportsBadge = inject(ModerationReportsBadgeStore);
    private readonly router = inject(Router);
    private readonly dialogs = inject(NbDialogService);
    private readonly sanctions = inject(SanctionsService);

    public status = this.store.status();
    private lastOpenCount = -1;

    public constructor() {
        effect(() => {
            const count = this.reportsBadge.openCount();
            if (this.lastOpenCount < 0) {
                this.lastOpenCount = count;
                return;
            }
            if (count !== this.lastOpenCount && this.status === "open") {
                void this.store.reload();
            }
            this.lastOpenCount = count;
        });
    }

    public onStatusChange(value: string): void {
        this.status = value;
        this.store.setStatus(this.status);
        void this.store.reload();
    }

    public openUser(publicId: string): void {
        void this.router.navigate(["/moderation/users", publicId]);
    }

    public async dismiss(report: ModerationReport): Promise<void> {
        await this.store.updateStatus(report.publicId, "dismissed");
    }

    public async sanction(report: ModerationReport, kind: "mute" | "ban"): Promise<void> {
        if (kind === "ban" && !this.permissions.canBan()) {
            return;
        }
        const ref = this.dialogs.open(SanctionDialogComponent, {
            context: { kind, nickname: report.targetLabel },
        });
        const result = (await firstValueFrom(ref.onClose)) as SanctionDialogResult | null;
        if (!result) {
            return;
        }
        await firstValueFrom(
            this.sanctions.create({
                targetPublicId: report.targetPublicId,
                kind,
                entitled: result.reason,
                endDate: result.endDate?.toISOString() ?? null,
            }),
        );
        await this.store.updateStatus(report.publicId, "actioned");
    }
}
