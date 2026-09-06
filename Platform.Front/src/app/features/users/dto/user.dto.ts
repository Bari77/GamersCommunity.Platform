export interface GameRoleAssignmentDto {
    gameUrlValue: string;
    code: string;
}

export interface ActiveMuteDto {
    reason: string;
    endDate: string;
}

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
