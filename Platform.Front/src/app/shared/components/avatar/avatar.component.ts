import { Component, model } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-avatar",
    imports: [],
    templateUrl: "./avatar.component.html",
    styleUrl: "./avatar.component.scss",
})
export class AvatarComponent {
    public readonly src = model<string>();
}
