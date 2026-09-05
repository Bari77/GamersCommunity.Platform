import { Component, inject, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { GamesStore } from "@features/games/stores/games.store";
import { UsersStore } from "@features/users/stores/users.store";
import {
    NbButtonModule,
    NbContextMenuModule,
    NbFormFieldModule,
    NbIconModule,
    NbInputModule,
    NbMenuModule,
    NbPopoverModule,
    NbSearchModule,
    NbSearchService,
    NbSpinnerModule,
    NbToastrService,
    NbTooltipModule,
    NbUserModule,
} from "@nebular/theme";
import { AvatarComponent } from "@shared/components/avatar/avatar.component";
import { SkeletonComponent } from "@shared/components/skeleton/skeleton.component";

@Component({
    standalone: true,
    selector: "app-header",
    imports: [
        FormsModule,
        NbFormFieldModule,
        NbButtonModule,
        NbInputModule,
        NbIconModule,
        NbUserModule,
        NbSearchModule,
        NbTooltipModule,
        NbContextMenuModule,
        NbSpinnerModule,
        NbMenuModule,
        NbPopoverModule,
        AvatarComponent,
        SkeletonComponent,
    ],
    templateUrl: "./header.component.html",
    styleUrl: "./header.component.scss",
})
export class HeaderComponent {
    public readonly gamesStore = inject(GamesStore);
    public readonly usersStore = inject(UsersStore);
    public readonly searchService = inject(NbSearchService);
    public readonly router = inject(Router);
    public toastr = inject(NbToastrService);

    public search = model<string>();
    public copied = model<boolean>(false);

    public constructor() {
        this.searchService.onSearchSubmit().subscribe((data: any) => {
            console.log(data.term);
        });
    }

    public copyToClipboard(): void {
        navigator.clipboard.writeText(this.usersStore.fullNickname());
        this.copied.set(true);
    }

    public redirect(url: string): void {
        this.router.navigate([url]);
    }
}
