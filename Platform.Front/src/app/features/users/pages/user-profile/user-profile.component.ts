import { DatePipe } from "@angular/common";
import { Component, computed, effect, inject, input, resource } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ReportDialogComponent } from "@features/moderation/components/report-dialog/report-dialog.component";
import { ReportDialogResult } from "@features/moderation/components/report-dialog/report-dialog-result.model";
import { ReportsService } from "@features/moderation/services/reports.service";
import { Game } from "@features/games/models/game.model";
import { GamePlayerSheet } from "@features/games/models/game-player-sheet.model";
import { GamePlayersService } from "@features/games/services/game-players.service";
import { GamesStore } from "@features/games/stores/games.store";
import { toGameRootPath } from "@features/games/utils/game-url.util";
import { FriendRelationKind, FriendsStore } from "@features/social/stores/friends.store";
import { MessengerStore } from "@features/social/stores/messenger.store";
import { UsersStore } from "@features/users/stores/users.store";
import { isUserOnline } from "@features/users/utils/presence.util";
import { NbButtonModule, NbDialogService, NbIconModule, NbSpinnerModule, NbToastrService } from "@nebular/theme";
import { GameTileComponent } from "@shared/components/game-tile/game-tile.component";
import { SkeletonComponent } from "@bari77/gc-ui";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { ResourceUtils } from "@shared/utils/resource.utils";
import { firstValueFrom } from "rxjs";
import { environment } from "environments/environment";
import { PublicUser } from "../../models/public-user.model";
import { UserDirectoryStore } from "../../stores/user-directory.store";

@Component({
    standalone: true,
    selector: "app-user-profile",
    imports: [
        NbButtonModule,
        NbIconModule,
        NbSpinnerModule,
        DatePipe,
        RouterLink,
        GameTileComponent,
        SkeletonComponent,
        UserHandleComponent,
    ],
    templateUrl: "./user-profile.component.html",
    styleUrl: "./user-profile.component.scss",
})
export class UserProfileComponent {
    public readonly publicId = input.required<string>();
    public readonly directoryStore = inject(UserDirectoryStore);
    public readonly usersStore = inject(UsersStore);
    public readonly friendsStore = inject(FriendsStore);
    public readonly messengerStore = inject(MessengerStore);
    public readonly gamesStore = inject(GamesStore);
    public readonly gameSheets = resource({
        // Tant que le catalogue n'est pas résolu, aucun paramètre : la resource reste `idle` plutôt que
        // de boucler sur une liste de jeux vide.
        params: () => {
            if (this.gamesStore.loading()) {
                return undefined;
            }

            return { platformUserPublicId: this.publicId(), gameTypes: this.gamesStore.gameTypes.value() };
        },
        loader: ({ params }) =>
            firstValueFrom(this.gamePlayersService.resolveCatalog(params.gameTypes, params.platformUserPublicId)),
        defaultValue: [] as GamePlayerSheet[],
    });
    public readonly gamesSectionLoading = computed(
        () => ResourceUtils.isPending(this.gameSheets) || this.gamesStore.loading(),
    );
    private readonly dialogs = inject(NbDialogService);
    private readonly reports = inject(ReportsService);
    private readonly gamePlayersService = inject(GamePlayersService);
    private readonly toastr = inject(NbToastrService);

    public constructor() {
        effect(() => {
            this.directoryStore.selectByPublicId(this.publicId());
        });

        effect(() => {
            if (this.usersStore.isLoggedIn()) {
                this.friendsStore.reload();
            }
        });
    }

    public isOwnProfile(): boolean {
        return this.usersStore.user()?.publicId === this.publicId();
    }

    public isOnline(lastConnection: Date | null): boolean {
        return isUserOnline(lastConnection);
    }

    public assetsIcon(picture: string): string {
        return `${environment.assetsBaseUrl}/Icons/Games/${picture}.png`;
    }

    public playersLink(game: Game): string {
        return `${toGameRootPath(game.urlValue)}/players`;
    }

    public relationKind(user: PublicUser): FriendRelationKind {
        return this.friendsStore.relationKindWith(user.id);
    }

    public async addFriend(user: PublicUser): Promise<void> {
        await this.friendsStore.request(user.id);
    }

    public async accept(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.accept(friend);
        }
    }

    public async refuse(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.refuse(friend);
        }
    }

    public async block(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.block(friend);
        }
    }

    public async remove(user: PublicUser): Promise<void> {
        await this.friendsStore.removePeer(user.id);
    }

    public async unblock(user: PublicUser): Promise<void> {
        const friend = this.friendsStore.relationWith(user.id);
        if (friend) {
            await this.friendsStore.unblock(friend);
        }
    }

    public whisper(user: PublicUser): void {
        this.messengerStore.openThread(user.id);
    }

    public async report(user: PublicUser): Promise<void> {
        const ref = this.dialogs.open(ReportDialogComponent, {
            context: { nickname: user.fullNickname },
        });
        const result = (await firstValueFrom(ref.onClose)) as ReportDialogResult | null;
        if (!result) {
            return;
        }
        await firstValueFrom(
            this.reports.create({
                targetPublicId: user.publicId,
                reason: result.reason,
                linkUrl: `/users/${user.publicId}`,
            }),
        );
        this.toastr.success(
            $localize`:@@moderation.report.sent:Thanks, the staff will review it.`,
            $localize`:@@moderation.report.sentTitle:Report sent`,
        );
    }
}
