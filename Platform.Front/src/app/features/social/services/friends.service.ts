import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { FriendDto } from "../dto/friend.dto";
import { FriendStatusIdValue } from "../models/friend-status";
import { Friend } from "../models/friend.model";

@Injectable({ providedIn: "root" })
export class FriendsService extends BaseService {
    public constructor() {
        super("/platform/friends");
    }

    public list(): Observable<Friend[]> {
        return this.getAll<FriendDto, Friend>(Friend);
    }

    public request(idFriendReceive: number): Observable<number> {
        return this.http.post<number>(this.getURL(), { idFriendReceive });
    }

    public updateStatus(friend: Friend, idFriendStatus: FriendStatusIdValue): Observable<boolean> {
        return this.http.put<boolean>(this.getURL(friend.publicId), {
            id: friend.id,
            publicId: friend.publicId,
            idFriendAsking: friend.idFriendAsking,
            idFriendReceive: friend.idFriendReceive,
            idFriendStatus,
        });
    }
}
