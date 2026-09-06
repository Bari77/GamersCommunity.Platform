import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { EventsUsersInterestDto } from "../dto/events-users-interest.dto";
import { EventRsvpStatusIdValue } from "../models/event-rsvp-status";
import { EventsUsersInterest } from "../models/events-users-interest.model";

@Injectable({ providedIn: "root" })
export class EventsUsersInterestsService extends BaseService {
    public constructor() {
        super("/platform/eventsUsersInterests");
    }

    public list(): Observable<EventsUsersInterest[]> {
        return this.getAll<EventsUsersInterestDto, EventsUsersInterest>(EventsUsersInterest);
    }

    public upsert(idEvent: number, idStatus: EventRsvpStatusIdValue): Observable<number> {
        return this.http.post<number>(this.getURL(), {
            idEvent,
            idStatus,
        });
    }
}
