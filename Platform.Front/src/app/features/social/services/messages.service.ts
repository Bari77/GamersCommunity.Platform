import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
import { DirectMessage } from "../models/message.model";
import { DirectMessageThread } from "../models/direct-message-thread.model";

@Injectable({ providedIn: "root" })
export class MessagesService extends BaseService {
    public constructor() {
        super("/platform/messages");
    }

    public listThread(conversationPublicId: string, beforePublicId?: string, take = 20): Observable<DirectMessage[]> {
        return this.post(DirectMessageThread, "actions/ListThread", {
            conversationPublicId,
            ...(beforePublicId ? { beforePublicId } : {}),
            take,
        }).pipe(map((thread) => thread.messages));
    }

    public create(conversationPublicId: string, content: string, parentPublicId?: string | null): Observable<string> {
        return this.postString(null, {
            conversationPublicId,
            content,
            parentPublicId: parentPublicId ?? null,
        });
    }

    public markThreadRead(conversationPublicId: string): Observable<number> {
        return this.postNumber("actions/MarkRead", { conversationPublicId });
    }
}
