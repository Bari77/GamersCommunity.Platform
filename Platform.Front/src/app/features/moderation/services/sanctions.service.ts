import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";
import { CreateSanctionRequestDto } from "../dto/create-sanction-request.dto";
import { Sanction } from "../models/sanction.model";

@Injectable({ providedIn: "root" })
export class SanctionsService extends BaseService {
    public constructor() {
        super("/platform/banned");
    }

    public create(request: CreateSanctionRequestDto): Observable<Sanction> {
        return this.post(Sanction, null, request);
    }

    public revoke(publicId: string): Observable<Sanction> {
        return this.put(Sanction, publicId, { revoke: true });
    }
}
