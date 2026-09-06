import { computed, inject, Injectable, resource } from "@angular/core";
import { Game } from "@features/games/models/game.model";
import { NbMenuItem } from "@nebular/theme";
import { environment } from "environments/environment";
import { firstValueFrom, map, zip } from "rxjs";
import { GameType } from "../models/gameType.model";
import { GameTypesService } from "../services/gameTypes.service";
import { GamesService } from "../services/games.service";

@Injectable({ providedIn: "root" })
export class GamesStore {
    public readonly gameTypes = resource({
        loader: () =>
            firstValueFrom(
                zip(this.gameTypesService.list(), this.gamesService.list()).pipe(
                    map(([types, games]) => {
                        types.forEach((type) => {
                            type.games = games.filter((game) => game.idType === type.id);
                        });
                        return types.filter((type) => type.games.length > 0);
                    }),
                ),
            ),
        defaultValue: [] as GameType[],
    });

    public readonly gameMenu = computed(() => this.buildMenu(this.gameTypes.value() ?? []));
    public readonly loading = computed(() => this.gameTypes.isLoading());

    private readonly gameTypesService = inject(GameTypesService);
    private readonly gamesService = inject(GamesService);

    public reload(): void {
        this.gameTypes.reload();
    }

    private buildMenu(types: GameType[]): NbMenuItem[] {
        return types.map((type) => ({
            title: type.entitled,
            group: true,
            children: type.games.map((game: Game) => ({
                title: game.title,
                icon: `${environment.assetsBaseUrl}/Icons/Games/${game.picture}.png`,
                link: game.urlValue.startsWith("/") ? game.urlValue : `/${game.urlValue}`,
            })),
        }));
    }
}
