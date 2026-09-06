import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { ConversationDto } from "../dto/conversation.dto";
import { Conversation } from "../models/conversation.model";

@Injectable({ providedIn: "root" })
export class ConversationsService extends BaseService {
    public constructor() {
        super("/platform/conversations");
    }

    public list(): Observable<Conversation[]> {
        return this.getAll<ConversationDto, Conversation>(Conversation);
    }

    public getByPublicId(publicId: string): Observable<Conversation> {
        return this.get<ConversationDto, Conversation>(Conversation, publicId);
    }

    public create(memberIds: number[], title?: string | null, avatarId?: number | null): Observable<Conversation> {
        return this.post<ConversationDto, Conversation>(Conversation, null, {
            memberIds,
            title: title?.trim() || null,
            avatarId: avatarId ?? null,
        });
    }

    public update(publicId: string, title?: string | null, avatarId?: number | null): Observable<Conversation> {
        return this.put<ConversationDto, Conversation>(Conversation, publicId, {
            title: title ?? null,
            avatarId: avatarId ?? null,
        });
    }

    public addMembers(publicId: string, memberIds: number[]): Observable<Conversation> {
        return this.post<ConversationDto, Conversation>(Conversation, `${publicId}/actions/AddMembers`, { memberIds });
    }

    public removeMembers(publicId: string, memberIds: number[]): Observable<Conversation> {
        return this.post<ConversationDto, Conversation>(Conversation, `${publicId}/actions/RemoveMembers`, {
            memberIds,
        });
    }

    public deleteConversation(publicId: string): Observable<void> {
        return this.delete(publicId);
    }
}
