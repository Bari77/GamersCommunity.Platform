import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { NotificationDto } from "../dto/notification.dto";
import { AppNotification } from "../models/notification.model";

@Injectable({ providedIn: "root" })
export class NotificationsService extends BaseService {
    public constructor() {
        super("/platform/notifications");
    }

    public list(): Observable<AppNotification[]> {
        return this.getAll<NotificationDto, AppNotification>(AppNotification);
    }

    public markRead(publicId: string): Observable<boolean> {
        return this.http.put<boolean>(this.getURL(publicId), {});
    }

    public markAllRead(): Observable<number> {
        return this.http.post<number>(this.getURL("actions/MarkAllRead"), {});
    }
}
