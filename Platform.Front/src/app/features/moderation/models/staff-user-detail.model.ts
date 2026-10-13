import { GameRoleAssignment } from "@core/security/acl-roles.util";
import { StaffUserDetailDto } from "../dto/staff-user-detail.dto";
import { StaffUser } from "./staff-user.model";
import { Sanction } from "./sanction.model";

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
