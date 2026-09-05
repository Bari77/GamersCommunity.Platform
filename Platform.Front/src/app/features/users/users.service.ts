import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { LoadRequestDto } from "./dto/load.dto";
import { UpdateUserRequestDto } from "./dto/update-user.dto";
import { UserDto } from "./dto/user.dto";
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

    public getUser(publicId: string): Observable<User> {
        return this.get<UserDto, User>(User, `${publicId}`);
    }
}
