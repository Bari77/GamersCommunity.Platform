import { Component, input } from "@angular/core";
import { SplashComponent } from "../splash/splash.component";

@Component({
    standalone: true,
    selector: "app-loading",
    imports: [SplashComponent],
    templateUrl: "./loading.component.html",
    styleUrls: ["./loading.component.scss"],
})
export class LoadingComponent {
    public readonly message = input<string>($localize`:@@core.layout.loading.message:Loading...`);
}
