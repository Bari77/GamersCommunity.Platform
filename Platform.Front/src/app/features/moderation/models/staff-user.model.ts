import { GameRoleAssignment } from "@core/security/acl-roles.util";
import { parseUtcDateOrNull } from "@shared/utils/utc-date.util";
import { StaffUserDto } from "../dto/staff-user.dto";

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
