import { computed, inject, Injectable, resource } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { ResourceUtils } from "@shared/utils/resource.utils";
import { firstValueFrom } from "rxjs";
import { GamePlayerSheet } from "../models/game-player-sheet.model";
import { GamePlayersService } from "../services/game-players.service";
import { GamesStore } from "./games.store";

@Injectable({ providedIn: "root" })
export class GameSheetsStore {
    public readonly sheets = resource({
        // Tant que le catalogue ou la session ne sont pas résolus, aucun paramètre : la resource reste
        // `idle` plutôt que de boucler sur une liste de jeux vide ou de conclure « aucune fiche » pour
        // un utilisateur dont la session n'est pas encore arrivée.
        params: () => {
            if (this.gamesStore.loading() || !this.usersStore.sessionResolved()) {
                return undefined;
            }

            return {
                platformUserPublicId: this.usersStore.user()?.publicId ?? null,
                gameTypes: this.gamesStore.gameTypes.value(),
            };
        },
        loader: ({ params }) => {
            if (!params.platformUserPublicId) {
                return Promise.resolve([] as GamePlayerSheet[]);
            }

            return firstValueFrom(
                this.gamePlayersService.resolveCatalog(params.gameTypes, params.platformUserPublicId),
            );
        },
        defaultValue: [] as GamePlayerSheet[],
    });

    public readonly loading = computed(() => ResourceUtils.isPending(this.sheets) || this.gamesStore.loading());

    private readonly usersStore = inject(UsersStore);
    private readonly gamesStore = inject(GamesStore);
    private readonly gamePlayersService = inject(GamePlayersService);

    public reload(): void {
        this.sheets.reload();
    }
}
