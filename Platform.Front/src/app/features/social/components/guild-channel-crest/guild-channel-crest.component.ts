import { Component, computed, input } from "@angular/core";
import { GuildChannelCrest } from "../../models/guild-channel-crest";

const pad = (index: number) => String(index).padStart(2, "0");

/**
 * WoW tabard, drawn the same way the game front does: grey silhouettes multiplied with the guild
 * colours. Artwork is loaded from the game origin encoded in the Whispers picture token.
 */
@Component({
    standalone: true,
    selector: "app-guild-channel-crest",
    templateUrl: "./guild-channel-crest.component.html",
    styleUrl: "./guild-channel-crest.component.scss",
})
export class GuildChannelCrestComponent {
    public readonly crest = input.required<GuildChannelCrest>();

    public readonly label = input("");

    protected readonly parts = computed(() => `${this.crest().assetsOrigin}/wow-crests`);

    protected readonly ringUrl = computed(
        () => `${this.parts()}/frames/${this.crest().faction === "horde" ? "horde" : "alliance"}.png`,
    );

    protected readonly flagArt = computed(() => `url(${this.parts()}/frames/flag.png)`);

    protected readonly hooksUrl = computed(() => `${this.parts()}/frames/hooks.png`);

    protected readonly borderArt = computed(() => `url(${this.parts()}/borders/${pad(this.crest().border)}.png)`);

    protected readonly emblemArt = computed(() => `url(${this.parts()}/emblems/${pad(this.crest().emblem)}.png)`);
}
