import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { UpdateGameRoleRequestDto, UpdateSiteRoleRequestDto } from "../dto/staff-user.dto";

@Injectable({ providedIn: "root" })
export class UserRolesService extends BaseService {
    public constructor() {
        super("/platform");
    }

    public updateSiteRole(request: UpdateSiteRoleRequestDto): Observable<void> {
        return this.postVoid("usersiteroles/actions/Update", request);
    }

    public updateGameRole(request: UpdateGameRoleRequestDto): Observable<void> {
        return this.postVoid("usergameroles/actions/Update", request);
    }
}
