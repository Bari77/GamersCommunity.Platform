import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { NbButtonModule, NbCardModule, NbCheckboxModule, NbDialogRef, NbInputModule, NbSelectModule } from "@nebular/theme";

export interface SanctionDialogResult {
    reason: string;
    endDate: Date | null;
}

@Component({
    standalone: true,
    selector: "app-sanction-dialog",
    templateUrl: "./sanction-dialog.component.html",
    styleUrl: "./sanction-dialog.component.scss",
    imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, NbInputModule, NbSelectModule, NbCheckboxModule],
})
export class SanctionDialogComponent {
    public kind: "mute" | "ban" = "mute";
    public nickname = "";

    private readonly dialogRef = inject(NbDialogRef<SanctionDialogComponent>);
    private readonly fb = inject(FormBuilder);

    public readonly form = this.fb.group({
        reason: ["", [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
        duration: ["24h"],
        permanent: [false],
    });

    public submit(): void {
        if (this.form.invalid) {
            return;
        }
        const permanent = this.kind === "ban" && !!this.form.value.permanent;
        this.dialogRef.close({
            reason: this.form.value.reason!.trim(),
            endDate: permanent ? null : this.endDateFromDuration(this.form.value.duration ?? "7d"),
        } satisfies SanctionDialogResult);
    }

    public cancel(): void {
        this.dialogRef.close(null);
    }

    private endDateFromDuration(duration: string): Date {
        const now = Date.now();
        const ms =
            duration === "1h"
                ? 3_600_000
                : duration === "24h"
                  ? 86_400_000
                  : duration === "7d"
                    ? 7 * 86_400_000
                    : 30 * 86_400_000;
        return new Date(now + ms);
    }
}
