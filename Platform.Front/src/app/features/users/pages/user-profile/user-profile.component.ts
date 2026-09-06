import { DatePipe } from "@angular/common";
import { Component, effect, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
    ReportDialogComponent,
    ReportDialogResult,
} from "@features/moderation/components/report-dialog/report-dialog.component";
import { ReportsService } from "@features/moderation/services/reports.service";
import { FriendRelationKind, FriendsStore } from "@features/social/stores/friends.store";
import { MessengerStore } from "@features/social/stores/messenger.store";
import { UsersStore } from "@features/users/stores/users.store";
import { isUserOnline } from "@features/users/utils/presence.util";
import { NbButtonModule, NbDialogService, NbSpinnerModule, NbToastrService } from "@nebular/theme";
import { UserHandleComponent } from "@shared/components/user-handle/user-handle.component";
import { firstValueFrom } from "rxjs";
import { PublicUser } from "../../models/public-user.model";
import { UserDirectoryStore } from "../../stores/user-directory.store";

@Component({
    standalone: true,
    selector: "app-user-profile",
    imports: [NbButtonModule, NbSpinnerModule, DatePipe, RouterLink, UserHandleComponent],
    templateUrl: "./user-profile.component.html",
    styleUrl: "./user-profile.component.scss",
})
export class UserProfileComponent {
    public readonly publicId = input.required<string>();
    public readonly directoryStore = inject(UserDirectoryStore);
    public readonly usersStore = inject(UsersStore);
    public readonly friendsStore = inject(FriendsStore);
    public readonly messengerStore = inject(MessengerStore);
    private readonly dialogs = inject(NbDialogService);
    private readonly reports = inject(ReportsService);
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
