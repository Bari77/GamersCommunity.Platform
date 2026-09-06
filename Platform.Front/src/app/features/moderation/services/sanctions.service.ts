import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
import { CreateSanctionRequestDto, SanctionDto } from "../dto/staff-user.dto";
import { Sanction } from "../models/staff-user.model";

@Injectable({ providedIn: "root" })
export class SanctionsService extends BaseService {
    public constructor() {
        super("/platform/banned");
    }

    public create(request: CreateSanctionRequestDto): Observable<Sanction> {
        return this.http.post<SanctionDto>(this.getURL(), request).pipe(map((dto) => Sanction.fromDto(dto)));
    }

    public revoke(publicId: string): Observable<Sanction> {
        return this.http
            .put<SanctionDto>(this.getURL(publicId), { revoke: true })
            .pipe(map((dto) => Sanction.fromDto(dto)));
    }
}
