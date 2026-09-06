import { GameRoleAssignment } from "@core/security/acl-roles.util";
import { parseUtcDate, parseUtcDateOrNull } from "@shared/utils/utc-date.util";
import { ReportDto, SanctionDto, StaffUserDetailDto, StaffUserDto } from "../dto/staff-user.dto";

export class StaffUser {
    public constructor(
        public id: number,
        public publicId: string,
        public nickname: string,
        public discriminator: string,
        public avatarUrl: string,
        public lastConnection: Date | null,
        public siteRoles: string[],
        public gameRoles: GameRoleAssignment[],
        public sanction: string,
    ) {}

    public get fullNickname(): string {
        return `${this.nickname}#${this.discriminator}`;
    }

    public get siteRole(): string {
        return this.siteRoles[0] ?? "member";
    }

    public static fromDto(dto: StaffUserDto): StaffUser {
        return new StaffUser(
            dto.id,
            dto.publicId,
            dto.nickname,
            dto.discriminator,
            dto.avatarUrl,
            parseUtcDateOrNull(dto.lastConnection),
            dto.siteRoles ?? [],
            dto.gameRoles ?? [],
            dto.sanction,
        );
    }
}

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

export class StaffUserDetail extends StaffUser {
    public constructor(
        id: number,
        publicId: string,
        nickname: string,
        discriminator: string,
        avatarUrl: string,
        lastConnection: Date | null,
        siteRoles: string[],
        gameRoles: GameRoleAssignment[],
        sanction: string,
        public sanctions: Sanction[],
    ) {
        super(id, publicId, nickname, discriminator, avatarUrl, lastConnection, siteRoles, gameRoles, sanction);
    }

    public static override fromDto(dto: StaffUserDetailDto): StaffUserDetail {
        const base = StaffUser.fromDto(dto);
        return new StaffUserDetail(
            base.id,
            base.publicId,
            base.nickname,
            base.discriminator,
            base.avatarUrl,
            base.lastConnection,
            base.siteRoles,
            base.gameRoles,
            base.sanction,
            (dto.sanctions ?? []).map((row) => Sanction.fromDto(row)),
        );
    }
}

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
