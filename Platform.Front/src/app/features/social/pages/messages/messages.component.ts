import { DatePipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbChatModule, NbSpinnerModule } from "@nebular/theme";
import { MessengerStore } from "../../stores/messenger.store";

@Component({
    standalone: true,
    selector: "app-messages",
    imports: [NbButtonModule, NbChatModule, NbSpinnerModule, DatePipe],
    templateUrl: "./messages.component.html",
    styleUrl: "./messages.component.scss",
})
export class MessagesComponent implements OnInit {
    public readonly messengerStore = inject(MessengerStore);
    public readonly usersStore = inject(UsersStore);
    public readonly now = new Date();
    public readonly youLabel = $localize`:@@social.messenger.you:You`;

    public ngOnInit(): void {
        this.messengerStore.setTab("chats");
        this.messengerStore.clearThread();
        this.messengerStore.refresh();
    }

    public onSend(event: { message: string; files: File[] }): void {
        void this.messengerStore.send(event.message);
    }
}
