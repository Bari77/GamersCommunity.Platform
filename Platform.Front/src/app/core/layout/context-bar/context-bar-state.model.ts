import { GameLink } from "./game-link.model";

export interface ContextBarState {
    hasTrail: boolean;
    nav: GameLink[];
    search: GameLink | null;
}
