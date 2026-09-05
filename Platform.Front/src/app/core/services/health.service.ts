import { Injectable } from "@angular/core";
import { ApiHealthDto } from "@core/dto/health.dto";
import { ApiHealth } from "@core/models/health.module";
import { BaseService } from "@shared/services/base.service";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class HealthService extends BaseService {
    public constructor() {
        super("/health");
    }

    public check(): Observable<ApiHealth> {
        return this.get<ApiHealthDto, ApiHealth>(ApiHealth);
    }
}
