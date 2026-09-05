import { GameDto } from "../dto/game.dto";

export class Game {
    public constructor(
        public id: number,
        public title: string,
        public urlValue: string,
        public picture: string,
        public idType: number,
    ) {}

    public static fromDto(dto: GameDto): Game {
        return new Game(dto.id, dto.title, dto.urlValue, dto.picture, dto.idType);
    }
}
