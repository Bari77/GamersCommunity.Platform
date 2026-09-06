import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
import { UpdateGameRoleRequestDto, UpdateSiteRoleRequestDto } from "../dto/staff-user.dto";

@Injectable({ providedIn: "root" })
export class UserRolesService {
    private readonly http = inject(HttpClient);

    public updateSiteRole(request: UpdateSiteRoleRequestDto): Observable<unknown> {
        return this.http.post(this.url("usersiteroles", "actions/Update"), request);
    }

    public updateGameRole(request: UpdateGameRoleRequestDto): Observable<unknown> {
        return this.http.post(this.url("usergameroles", "actions/Update"), request);
    }

    private url(resource: string, path: string): string {
        return `${environment.apiUrl.replace(/\/+$/, "")}/platform/${resource}/${path}`;
    }
}
