import { GameRoleAssignmentDto } from "./game-role-assignment.dto";
import { ActiveMuteDto } from "./active-mute.dto";

export interface UserDto {
    id: number;
    publicId: string;
    nickname: string;
    discriminator: string;
    avatarUrl: string;
    mail: string;
    lastConnection: string;
    idKeycloak: string;
    siteRoles?: string[];
    gameRoles?: GameRoleAssignmentDto[];
    activeMute?: ActiveMuteDto | null;
}
