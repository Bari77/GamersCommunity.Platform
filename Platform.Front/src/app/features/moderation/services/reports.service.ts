import { Injectable } from "@angular/core";
import { BaseService } from "@shared/services/base.service";
import { map, Observable } from "rxjs";
import { ReportListRequestDto } from "../dto/report-list-request.dto";
import { CreateReportRequestDto } from "../dto/create-report-request.dto";
import { OpenReportsCount } from "../models/open-reports-count.model";
import { ModerationReport } from "../models/moderation-report.model";

@Injectable({ providedIn: "root" })
export class ReportsService extends BaseService {
    public constructor() {
        super("/platform/reports");
    }

    public create(request: CreateReportRequestDto): Observable<ModerationReport> {
        return this.post(ModerationReport, null, request);
    }

    public list(request: ReportListRequestDto): Observable<ModerationReport[]> {
        return this.postList(ModerationReport, "actions/List", request);
    }

    public updateStatus(publicId: string, status: string): Observable<ModerationReport> {
        return this.put(ModerationReport, publicId, { status });
    }

    public countOpen(): Observable<number> {
        return this.post(OpenReportsCount, "actions/Count", {}).pipe(map((result) => result.openCount));
    }
}
