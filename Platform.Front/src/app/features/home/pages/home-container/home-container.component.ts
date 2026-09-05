import { Component } from "@angular/core";
import { GameVideoComponent } from "@core/layout/splash/components/game-video/game-video.component";

@Component({
    standalone: true,
    selector: "app-home-container",
    imports: [GameVideoComponent],
    templateUrl: "./home-container.component.html",
    styleUrl: "./home-container.component.scss",
})
export class HomeContainerComponent {}
