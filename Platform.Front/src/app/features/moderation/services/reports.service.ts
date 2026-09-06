import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
import { CreateReportRequestDto, ReportDto, ReportListRequestDto } from "../dto/staff-user.dto";
import { ModerationReport } from "../models/staff-user.model";

@Injectable({ providedIn: "root" })
export class ReportsService extends BaseService {
    public constructor() {
        super("/platform/reports");
    }

    public create(request: CreateReportRequestDto): Observable<ModerationReport> {
        return this.http.post<ReportDto>(this.getURL(), request).pipe(map((dto) => ModerationReport.fromDto(dto)));
    }

    public list(request: ReportListRequestDto): Observable<ModerationReport[]> {
        return this.http
            .post<ReportDto[]>(this.getURL("actions/List"), request)
            .pipe(map((rows) => rows.map((row) => ModerationReport.fromDto(row))));
    }

    public updateStatus(publicId: string, status: string): Observable<ModerationReport> {
        return this.http
            .put<ReportDto>(this.getURL(publicId), { status })
            .pipe(map((dto) => ModerationReport.fromDto(dto)));
    }

    public countOpen(): Observable<number> {
        return this.http
            .post<{ openCount: number }>(this.getURL("actions/Count"), {})
            .pipe(map((dto) => dto.openCount ?? 0));
    }
}
