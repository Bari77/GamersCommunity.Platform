import { computed, inject, Injectable, resource } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Game } from "@features/games/models/game.model";
import { ResourceUtils } from "@shared/utils/resource.utils";
import { environment } from "environments/environment";
import { firstValueFrom, interval, map, zip } from "rxjs";
import { GameMenuGroup } from "../models/game-menu.model";
import { GameType } from "../models/gameType.model";
import { GameAvailabilityService } from "../services/game-availability.service";
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

    public readonly availability = resource({
        loader: () => firstValueFrom(this.availabilityService.list()),
        defaultValue: new Map<string, boolean>(),
    });

    public readonly gameMenu = computed(() => this.buildMenu(this.gameTypes.value() ?? []));
    public readonly catalog = computed(() =>
        (this.gameTypes.value() ?? []).map((type) => ({
            id: type.id,
            entitled: type.entitled,
            games: type.games.map((game) => ({
                game,
                available: this.isAvailable(game.urlValue),
            })),
        })),
    );
    public readonly loading = computed(() => ResourceUtils.isPending(this.gameTypes));

    private readonly gameTypesService = inject(GameTypesService);
    private readonly gamesService = inject(GamesService);
    private readonly availabilityService = inject(GameAvailabilityService);

    public constructor() {
        interval(15_000)
            .pipe(takeUntilDestroyed())
            .subscribe(() => this.availability.reload());
    }

    public reload(): void {
        this.gameTypes.reload();
        this.availability.reload();
    }

    public isAvailable(urlValue: string): boolean {
        return GameAvailabilityService.isAvailable(this.availability.value(), urlValue);
    }

    private buildMenu(types: GameType[]): GameMenuGroup[] {
        return types.map((type) => ({
            title: type.entitled,
            children: type.games.map((game: Game) => ({
                title: game.title,
                icon: `${environment.assetsBaseUrl}/Icons/Games/${game.picture}.png`,
                link: game.urlValue.startsWith("/") ? game.urlValue : `/${game.urlValue}`,
                available: this.isAvailable(game.urlValue),
            })),
        }));
    }
}
