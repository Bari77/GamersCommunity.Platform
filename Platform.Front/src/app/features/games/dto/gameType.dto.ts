import { GameDto } from "./game.dto";

export interface GameTypeDto {
    id: number;
    entitled: string;
    games: GameDto[];
}
