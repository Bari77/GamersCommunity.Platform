import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { StaffListRequestDto } from "../dto/staff-list-request.dto";
import { StaffUser } from "../models/staff-user.model";
import { StaffUserDetail } from "../models/staff-user-detail.model";

@Injectable({ providedIn: "root" })
export class StaffUsersService extends BaseService {
    public constructor() {
        super("/platform/users");
    }

    public list(request: StaffListRequestDto): Observable<StaffUser[]> {
        return this.postList(StaffUser, "actions/StaffList", request);
    }

    public getDetail(publicId: string): Observable<StaffUserDetail> {
        return this.post(StaffUserDetail, `${publicId}/actions/StaffGet`, {});
    }
}
