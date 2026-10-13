import { Component, input } from "@angular/core";
import { NbIconModule, NbSpinnerModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-splash",
    imports: [NbSpinnerModule, NbIconModule],
    templateUrl: "./splash.component.html",
    styleUrl: "./splash.component.scss",
})
export class SplashComponent {
    public readonly type = input<"base" | "warning" | "error">("base");
    public readonly message = input<string>("");
}
