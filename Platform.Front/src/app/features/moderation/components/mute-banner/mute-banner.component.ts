import { DatePipe } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";

@Component({
    standalone: true,
    selector: "app-mute-banner",
    imports: [DatePipe],
    templateUrl: "./mute-banner.component.html",
    styleUrl: "./mute-banner.component.scss",
})
export class MuteBannerComponent {
    private readonly usersStore = inject(UsersStore);

    public readonly mute = computed(() => this.usersStore.activeMute());
}
