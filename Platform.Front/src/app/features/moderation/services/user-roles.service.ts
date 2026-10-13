import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { UpdateSiteRoleRequestDto } from "../dto/update-site-role-request.dto";
import { UpdateGameRoleRequestDto } from "../dto/update-game-role-request.dto";

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
