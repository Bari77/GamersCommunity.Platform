import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
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
        return this.get<PublicUserDto, PublicUser>(PublicUser, `${publicId}`);
    }

    public search(query: string): Observable<PublicUser[]> {
        return this.http
            .post<PublicUserDto[]>(this.getURL("actions/Search"), { query })
            .pipe(map((dtos) => dtos.map((dto) => PublicUser.fromDto(dto))));
    }

    public touch(): Observable<PublicUser> {
        return this.http
            .post<PublicUserDto>(this.getURL("actions/Touch"), {})
            .pipe(map((dto) => PublicUser.fromDto(dto)));
    }
}
