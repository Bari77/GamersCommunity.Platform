import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { Router } from "@angular/router";
import { NbButtonModule, NbSpinnerModule } from "@nebular/theme";
import { CommunityEvent } from "../../models/event.model";
import { EventsStore } from "../../stores/events.store";

@Component({
    standalone: true,
    selector: "app-events-list",
    imports: [NbButtonModule, NbSpinnerModule, DatePipe],
    templateUrl: "./events-list.component.html",
    styleUrl: "./events-list.component.scss",
})
export class EventsListComponent {
    public readonly eventsStore = inject(EventsStore);
    private readonly router = inject(Router);

    public open(event: CommunityEvent): void {
        this.router.navigate(["/events", event.publicId]);
    }
}
