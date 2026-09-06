import { DatePipe } from "@angular/common";
import { Component, effect, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { UsersStore } from "@features/users/stores/users.store";
import { NbButtonModule, NbSpinnerModule } from "@nebular/theme";
import { EventRsvpStatusId, EventRsvpStatusIdValue } from "../../models/event-rsvp-status";
import { EventsUsersInterestsStore } from "../../stores/events-users-interests.store";
import { EventsStore } from "../../stores/events.store";

@Component({
    standalone: true,
    selector: "app-event-detail",
    imports: [NbButtonModule, NbSpinnerModule, DatePipe, RouterLink],
    templateUrl: "./event-detail.component.html",
    styleUrl: "./event-detail.component.scss",
})
export class EventDetailComponent {
    public readonly publicId = input.required<string>();
    public readonly eventsStore = inject(EventsStore);
    public readonly interestsStore = inject(EventsUsersInterestsStore);
    public readonly usersStore = inject(UsersStore);
    public readonly EventRsvpStatusId = EventRsvpStatusId;

    public constructor() {
        effect(() => {
            this.eventsStore.selectByPublicId(this.publicId());
        });

        effect(() => {
            if (this.usersStore.isLoggedIn()) {
                this.interestsStore.reload();
            }
        });
    }

    public currentStatus(idEvent: number): EventRsvpStatusIdValue | null {
        return this.interestsStore.statusForEvent(idEvent);
    }

    public rsvp(idEvent: number, status: EventRsvpStatusIdValue): void {
        void this.interestsStore.upsert(idEvent, status);
    }
}
