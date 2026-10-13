import { parseUtcDate, parseUtcDateOrNull } from "@shared/utils/utc-date.util";
import { SanctionDto } from "../dto/sanction.dto";

export class Sanction {
    public constructor(
        public publicId: string,
        public kind: string,
        public entitled: string,
        public beginDate: Date,
        public endDate: Date | null,
        public revokedAt: Date | null,
        public modoPublicId: string,
        public modoNickname: string,
        public active: boolean,
    ) {}

    public static fromDto(dto: SanctionDto): Sanction {
        return new Sanction(
            dto.publicId,
            dto.kind,
            dto.entitled,
            parseUtcDate(dto.beginDate),
            parseUtcDateOrNull(dto.endDate),
            parseUtcDateOrNull(dto.revokedAt),
            dto.modoPublicId,
            dto.modoNickname,
            dto.active,
        );
    }
}
