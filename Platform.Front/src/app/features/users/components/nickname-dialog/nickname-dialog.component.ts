import { Component, inject } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { NbButtonModule, NbCardModule, NbDialogRef, NbInputModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-nickname-dialog",
    templateUrl: "./nickname-dialog.component.html",
    styleUrls: ["./nickname-dialog.component.scss"],
    imports: [FormsModule, ReactiveFormsModule, NbCardModule, NbButtonModule, NbInputModule],
})
export class NicknameDialogComponent {
    public readonly fb = inject(FormBuilder);

    public form = this.fb.group({
        nickname: [
            undefined as string | undefined,
            [Validators.required, Validators.maxLength(50), Validators.pattern(/^[A-Za-z0-9_-]+$/)],
        ],
    });

    private readonly dialogRef = inject(NbDialogRef<NicknameDialogComponent>);

    public submit(): void {
        if (this.form.invalid) return;

        this.dialogRef.close(this.form.value.nickname);
    }

    public cancel(): void {
        this.dialogRef.close(null);
    }
}
