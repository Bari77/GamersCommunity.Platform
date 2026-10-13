import { Game } from "./game.model";

export interface GamePlayerSheet {
    game: Game;
    typeLabel: string;
    playerPublicId: string;
}
