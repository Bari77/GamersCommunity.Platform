import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { GameTypeDto } from "../dto/gameType.dto";
import { GameType } from "../models/gameType.model";

@Injectable({ providedIn: "root" })
export class GameTypesService extends BaseService {
    public constructor() {
        super("/platform/gametypes");
    }

    public list(): Observable<GameType[]> {
        return this.getAll<GameTypeDto, GameType>(GameType);
    }
}
