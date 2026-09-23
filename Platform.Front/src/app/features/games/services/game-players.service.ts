import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { catchError, forkJoin, map, Observable, of, switchMap, timeout } from "rxjs";
import { GamePlayerResolveResultDto } from "../dto/game-player.dto";
import { GamePlayerResolveResult, GamePlayerSheet } from "../models/game-player-sheet.model";
import { Game } from "../models/game.model";
import { GameType } from "../models/gameType.model";
import { GameAvailabilityService } from "./game-availability.service";
import { toGameApiSegment } from "../utils/game-url.util";

@Injectable({ providedIn: "root" })
export class GamePlayersService {
    private readonly http = inject(HttpClient);
    private readonly availability = inject(GameAvailabilityService);

    public resolve(game: Game | string, platformUserPublicId: string): Observable<GamePlayerResolveResult> {
        const urlValue = typeof game === "string" ? game : game.urlValue;

        return this.http
            .post<GamePlayerResolveResultDto>(this.resolveURL(urlValue), { platformUserPublicId })
            .pipe(
                timeout(4000),
                map((dto) => ({ playerPublicId: dto.playerPublicId, hasSheet: dto.hasSheet })),
            );
    }

    public resolveCatalog(gameTypes: GameType[], platformUserPublicId: string): Observable<GamePlayerSheet[]> {
        const entries = gameTypes.flatMap((type) => type.games.map((game) => ({ game, typeLabel: type.entitled })));

        if (entries.length === 0) {
            return of([]);
        }

        return this.availability.list().pipe(
            switchMap((statuses) =>
                forkJoin(
                    entries.map((entry) => {
                        if (!GameAvailabilityService.isAvailable(statuses, entry.game.urlValue)) {
                            return of(null);
                        }

                        return this.resolve(entry.game, platformUserPublicId).pipe(
                            map((result) =>
                                result.hasSheet && result.playerPublicId
                                    ? {
                                          game: entry.game,
                                          typeLabel: entry.typeLabel,
                                          playerPublicId: result.playerPublicId,
                                      }
                                    : null,
                            ),
                            catchError(() => of(null)),
                        );
                    }),
                ),
            ),
            map((sheets) => sheets.filter((sheet): sheet is GamePlayerSheet => sheet !== null)),
        );
    }

    private resolveURL(urlValue: string): string {
        const base = new URL(environment.apiUrl);
        base.pathname = `${base.pathname.replace(/\/+$/, "")}/${toGameApiSegment(urlValue)}/Players/actions/Resolve`;

        return base.toString().replace(/\/+$/, "");
    }
}
