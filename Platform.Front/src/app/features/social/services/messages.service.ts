import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
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

    public listThread(peerId: number, beforePublicId?: string, take = 20): Observable<DirectMessage[]> {
        return this.http
            .post<MessageDto[]>(this.getURL("actions/ListThread"), {
                peerId,
                beforePublicId: beforePublicId ?? null,
                take,
            })
            .pipe(map((dtos) => dtos.map((dto) => DirectMessage.fromDto(dto))));
    }

    public create(idReceiver: number, content: string, parentPublicId?: string | null): Observable<string> {
        return this.http.post<string>(this.getURL(), {
            idReceiver,
            content,
            parentPublicId: parentPublicId ?? null,
        });
    }

    public markThreadRead(peerId: number): Observable<number> {
        return this.http.post<number>(this.getURL("actions/MarkRead"), { peerId });
    }
}
