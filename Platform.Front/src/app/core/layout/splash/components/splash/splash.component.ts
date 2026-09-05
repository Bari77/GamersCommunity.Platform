import { Component, input } from "@angular/core";
import { NbIconModule, NbSpinnerModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-splash",
    imports: [NbSpinnerModule, NbIconModule],
    templateUrl: "./splash.component.html",
    styleUrls: ["./splash.component.scss"],
})
export class SplashComponent {
    public type = input<"base" | "warning" | "error">("base");
    public message = input<string>("");
}
