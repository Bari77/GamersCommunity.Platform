import { GameRoleAssignmentDto } from "@features/users/dto/game-role-assignment.dto";

export interface StaffUserDto {
    id: number;
    publicId: string;
    nickname: string;
    discriminator: string;
    avatarUrl: string;
    lastConnection?: string | null;
    siteRoles: string[];
    gameRoles: GameRoleAssignmentDto[];
    sanction: string;
}
