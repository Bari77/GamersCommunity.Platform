import { parseUtcDate } from "@shared/utils/utc-date.util";
import { ReportDto } from "../dto/report.dto";

export class ModerationReport {
    public constructor(
        public publicId: string,
        public reporterPublicId: string,
        public reporterNickname: string,
        public reporterDiscriminator: string,
        public targetPublicId: string,
        public targetNickname: string,
        public targetDiscriminator: string,
        public targetAvatarUrl: string,
        public reason: string,
        public status: string,
        public linkUrl: string | null,
        public creationDate: Date,
    ) {}

    public get targetLabel(): string {
        return `${this.targetNickname}#${this.targetDiscriminator}`;
    }

    public get reporterLabel(): string {
        return `${this.reporterNickname}#${this.reporterDiscriminator}`;
    }

    public static fromDto(dto: ReportDto): ModerationReport {
        return new ModerationReport(
            dto.publicId,
            dto.reporterPublicId,
            dto.reporterNickname,
            dto.reporterDiscriminator,
            dto.targetPublicId,
            dto.targetNickname,
            dto.targetDiscriminator,
            dto.targetAvatarUrl,
            dto.reason,
            dto.status,
            dto.linkUrl ?? null,
            parseUtcDate(dto.creationDate),
        );
    }
}
