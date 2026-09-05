import { GameTypeDto } from "../dto/gameType.dto";
import { Game } from "./game.model";

export class GameType {
    public constructor(
        public id: number,
        public entitled: string,
        public games: Game[],
    ) {}

    public static fromDto(dto: GameTypeDto): GameType {
        return new GameType(
            dto.id,
            dto.entitled,
            dto.games.map((g) => Game.fromDto(g)),
        );
    }
}
