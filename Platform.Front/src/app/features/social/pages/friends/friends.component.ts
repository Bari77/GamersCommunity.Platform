import { Component, inject } from "@angular/core";
import { MessengerStore } from "../../stores/messenger.store";
import { FriendsStore } from "../../stores/friends.store";
import { Friend } from "../../models/friend.model";
import { NbButtonModule, NbIconModule, NbSpinnerModule } from "@nebular/theme";

@Component({
    standalone: true,
    selector: "app-friends",
    imports: [NbButtonModule, NbIconModule, NbSpinnerModule],
    templateUrl: "./friends.component.html",
    styleUrl: "./friends.component.scss",
})
export class FriendsComponent {
    public readonly friendsStore = inject(FriendsStore);
    private readonly messengerStore = inject(MessengerStore);

    public message(friend: Friend): void {
        this.messengerStore.openThread(this.friendsStore.peerId(friend));
    }
}
