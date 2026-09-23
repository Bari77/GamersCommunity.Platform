import { NgTemplateOutlet } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NbIconModule, NbTooltipModule } from "@nebular/theme";
import { SkeletonComponent } from "@bari77/gc-ui";

@Component({
    standalone: true,
    selector: "app-game-tile",
    imports: [NgTemplateOutlet, RouterLink, NbIconModule, NbTooltipModule, SkeletonComponent],
    templateUrl: "./game-tile.component.html",
    styleUrl: "./game-tile.component.scss",
})
export class GameTileComponent {
    public readonly title = input("");
    public readonly typeLabel = input("");
    public readonly iconUrl = input("");
    /** Cible de navigation. Sans lien, la tuile devient un bouton qui émet `activated`. */
    public readonly link = input<string | unknown[] | null>(null);
    public readonly skeleton = input(false);
    public readonly available = input(true);
    public readonly activated = output<void>();
    protected readonly unavailableLabel = $localize`:@@games.unavailable:Temporarily unavailable`;
}
