import { Component, inject } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { NbButtonModule, NbCardModule, NbDialogRef, NbInputModule } from "@nebular/theme";
import { ReportDialogResult } from "./report-dialog-result.model";

@Component({
    standalone: true,
    selector: "app-report-dialog",
    templateUrl: "./report-dialog.component.html",
    styleUrl: "./report-dialog.component.scss",
    imports: [ReactiveFormsModule, NbCardModule, NbButtonModule, NbInputModule],
})
export class ReportDialogComponent {
    public nickname = "";

    public readonly fb = inject(FormBuilder);
    public readonly form = this.fb.group({
        reason: ["", [Validators.required, Validators.minLength(8), Validators.maxLength(1000)]],
    });

    private readonly dialogRef = inject(NbDialogRef<ReportDialogComponent>);

    public submit(): void {
        if (this.form.invalid) {
            return;
        }
        this.dialogRef.close({ reason: this.form.value.reason!.trim() } satisfies ReportDialogResult);
    }

    public cancel(): void {
        this.dialogRef.close(null);
    }
}
