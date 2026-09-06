import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { MessageDto } from "../dto/message.dto";
import { DirectMessage } from "../models/message.model";

@Injectable({ providedIn: "root" })
export class MessagesService extends BaseService {
    public constructor() {
        super("/platform/messages");
    }

    public list(): Observable<DirectMessage[]> {
        return this.getAll<MessageDto, DirectMessage>(DirectMessage);
    }

    public create(idReceiver: number, content: string): Observable<number> {
        return this.http.post<number>(this.getURL(), {
            idReceiver,
            content,
        });
    }

    public markThreadRead(peerId: number): Observable<number> {
        return this.http.post<number>(this.getURL("actions/MarkRead"), { peerId });
    }
}
