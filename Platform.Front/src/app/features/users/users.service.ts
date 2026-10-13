import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { LoadRequestDto } from "./dto/load.dto";
import { PublicUserDto } from "./dto/public-user.dto";
import { UpdateUserRequestDto } from "./dto/update-user.dto";
import { UserDto } from "./dto/user.dto";
import { PublicUser } from "./models/public-user.model";
import { User } from "./models/user.model";

@Injectable({ providedIn: "root" })
export class UsersService extends BaseService {
    public constructor() {
        super("/platform/users");
    }

    public loadUser(data: LoadRequestDto): Observable<User | null> {
        return this.post<UserDto, User>(User, "actions/Load", data);
    }

    public update(publicId: string, data: UpdateUserRequestDto): Observable<User> {
        return this.put<UserDto, User>(User, publicId, data);
    }

    public getUser(publicId: string): Observable<PublicUser> {
        return this.getOne<PublicUserDto, PublicUser>(PublicUser, `${publicId}`);
    }

    public search(query: string): Observable<PublicUser[]> {
        return this.postList(PublicUser, "actions/Search", { query });
    }

    public touch(): Observable<User> {
        return this.post<UserDto, User>(User, "actions/Touch", {});
    }
}
