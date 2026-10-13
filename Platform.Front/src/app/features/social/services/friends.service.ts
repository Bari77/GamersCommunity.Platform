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
        return this.postNumber(null, { idFriendReceive });
    }

    public updateStatus(friend: Friend, idFriendStatus: FriendStatusIdValue): Observable<boolean> {
        return this.putBool(friend.publicId, {
            id: friend.id,
            publicId: friend.publicId,
            idFriendAsking: friend.idFriendAsking,
            idFriendReceive: friend.idFriendReceive,
            idFriendStatus,
        });
    }

    public remove(friend: Friend): Observable<void> {
        return this.delete(friend.publicId);
    }
}
