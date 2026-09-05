import { AfterViewInit, Component, computed, ElementRef, input, ViewChild } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-game-video",
    imports: [],
    templateUrl: "./game-video.component.html",
    styleUrls: ["./game-video.component.scss"],
})
export class GameVideoComponent implements AfterViewInit {
    @ViewChild("introVideo") private videoRef!: ElementRef<HTMLVideoElement>;

    public name = input<string>("");

    public src = computed<string>(() => `https://host.bariserv.net/GamersCommunity/Videos/${this.name()}_intro.mp4`);
    public poster = computed<string>(() => `https://host.bariserv.net/GamersCommunity/Videos/${this.name()}_intro.png`);

    public ngAfterViewInit(): void {
        setTimeout(() => {
            const video = this.videoRef.nativeElement;
            video.muted = true;
            video.play();
        }, 20);
    }
}
