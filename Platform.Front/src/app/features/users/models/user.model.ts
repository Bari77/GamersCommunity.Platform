import { GameRoleAssignment } from "@core/security/acl-roles.util";
import { parseUtcDate } from "@shared/utils/utc-date.util";
import { UserDto } from "../dto/user.dto";

export class ActiveMute {
    public constructor(
        public reason: string,
        public endDate: Date,
    ) {}
}

export class User {
    public constructor(
        public id: number,
        public publicId: string,
        public nickname: string,
        public discriminator: string,
        public avatarUrl: string,
        public mail: string,
        public lastConnection: Date,
        public idKeycloak: string,
        public siteRoles: string[] = [],
        public gameRoles: GameRoleAssignment[] = [],
        public activeMute: ActiveMute | null = null,
    ) {}

    public static fromDto(dto: UserDto): User {
        return new User(
            Number(dto.id),
            dto.publicId,
            dto.nickname,
            dto.discriminator,
            dto.avatarUrl,
            dto.mail,
            parseUtcDate(dto.lastConnection),
            dto.idKeycloak,
            dto.siteRoles ?? [],
            dto.gameRoles ?? [],
            dto.activeMute
                ? new ActiveMute(dto.activeMute.reason, parseUtcDate(dto.activeMute.endDate))
                : null,
        );
    }
}
