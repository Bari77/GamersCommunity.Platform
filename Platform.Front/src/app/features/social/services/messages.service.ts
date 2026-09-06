import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
import { DirectMessage } from "../models/message.model";

@Injectable({ providedIn: "root" })
export class MessagesService extends BaseService {
    public constructor() {
        super("/platform/messages");
    }

    public listThread(conversationPublicId: string, beforePublicId?: string, take = 20): Observable<DirectMessage[]> {
        return this.http
            .post<unknown>(this.getURL("actions/ListThread"), {
                conversationPublicId,
                ...(beforePublicId ? { beforePublicId } : {}),
                take,
            })
            .pipe(map((body) => DirectMessage.fromList(body)));
    }

    public create(conversationPublicId: string, content: string, parentPublicId?: string | null): Observable<string> {
        return this.http.post<string>(this.getURL(), {
            conversationPublicId,
            content,
            parentPublicId: parentPublicId ?? null,
        });
    }

    public markThreadRead(conversationPublicId: string): Observable<number> {
        return this.http.post<number>(this.getURL("actions/MarkRead"), { conversationPublicId });
    }
}
