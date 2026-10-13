import { AfterViewInit, Component, computed, ElementRef, input, viewChild } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-game-video",
    imports: [],
    templateUrl: "./game-video.component.html",
    styleUrl: "./game-video.component.scss",
})
export class GameVideoComponent implements AfterViewInit {
    public readonly name = input<string>("world-of-warcraft");

    public readonly src = computed<string>(
        () => `https://host.bariserv.net/GamersCommunity/Videos/${this.name()}_intro.mp4`,
    );
    public readonly poster = computed<string>(
        () => `https://host.bariserv.net/GamersCommunity/Videos/${this.name()}_intro.png`,
    );

    private readonly videoRef = viewChild.required<ElementRef<HTMLVideoElement>>("introVideo");

    public ngAfterViewInit(): void {
        const video = this.videoRef().nativeElement;
        video.muted = true;
        const tryPlay = (): void => {
            void video.play().catch(() => undefined);
        };
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            tryPlay();
        } else {
            video.addEventListener("loadeddata", tryPlay, { once: true });
        }
    }
}
