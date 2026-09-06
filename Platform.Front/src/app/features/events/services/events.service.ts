import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { EventDto } from "../dto/event.dto";
import { CommunityEvent } from "../models/event.model";

@Injectable({ providedIn: "root" })
export class EventsService extends BaseService {
    public constructor() {
        super("/platform/events");
    }

    public list(): Observable<CommunityEvent[]> {
        return this.getAll<EventDto, CommunityEvent>(CommunityEvent);
    }

    public getByPublicId(publicId: string): Observable<CommunityEvent> {
        return this.get<EventDto, CommunityEvent>(CommunityEvent, publicId);
    }
}
