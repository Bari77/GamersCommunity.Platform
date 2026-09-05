import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { GameDto } from "../dto/game.dto";
import { Game } from "../models/game.model";

@Injectable({ providedIn: "root" })
export class GamesService extends BaseService {
    public constructor() {
        super("/platform/games");
    }

    public list(): Observable<Game[]> {
        return this.getAll<GameDto, Game>(Game);
    }
}
