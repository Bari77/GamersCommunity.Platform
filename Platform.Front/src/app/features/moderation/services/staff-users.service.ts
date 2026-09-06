import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
import { StaffListRequestDto, StaffUserDetailDto, StaffUserDto } from "../dto/staff-user.dto";
import { StaffUser, StaffUserDetail } from "../models/staff-user.model";

@Injectable({ providedIn: "root" })
export class StaffUsersService extends BaseService {
    public constructor() {
        super("/platform/users");
    }

    public list(request: StaffListRequestDto): Observable<StaffUser[]> {
        return this.http
            .post<StaffUserDto[]>(this.getURL("actions/StaffList"), request)
            .pipe(map((rows) => rows.map((row) => StaffUser.fromDto(row))));
    }

    public getDetail(publicId: string): Observable<StaffUserDetail> {
        return this.http
            .post<StaffUserDetailDto>(this.getURL(`${publicId}/actions/StaffGet`), {})
            .pipe(map((dto) => StaffUserDetail.fromDto(dto)));
    }
}
