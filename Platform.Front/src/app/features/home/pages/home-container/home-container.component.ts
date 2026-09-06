import { Component, ElementRef, inject, viewChild } from "@angular/core";
import { Router } from "@angular/router";
import { GameVideoComponent } from "@core/layout/splash/components/game-video/game-video.component";
import { GamesStore } from "@features/games/stores/games.store";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbIconModule } from "@nebular/theme";
import { SkeletonComponent } from "@shared/components/skeleton/skeleton.component";
import { environment } from "environments/environment";

@Component({
    standalone: true,
    selector: "app-home-container",
    imports: [GameVideoComponent, NbButtonModule, NbIconModule, SkeletonComponent],
    templateUrl: "./home-container.component.html",
    styleUrl: "./home-container.component.scss",
})
export class HomeContainerComponent {
    public readonly gamesStore = inject(GamesStore);
    public readonly usersStore = inject(UsersStore);
    private readonly router = inject(Router);
    private readonly gamesSection = viewChild<ElementRef<HTMLElement>>("gamesSection");

    public go(path: string): void {
        const url = path.startsWith("/") ? path : `/${path}`;
        void this.router.navigateByUrl(url);
    }

    public scrollToGames(): void {
        this.gamesSection()?.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    public assetsIcon(picture: string): string {
        return `${environment.assetsBaseUrl}/Icons/Games/${picture}.png`;
    }
}
