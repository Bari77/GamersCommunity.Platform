import { GameRoleAssignmentDto } from "@features/users/dto/user.dto";

export interface StaffListRequestDto {
    query?: string;
    siteRole?: string;
    sanction?: string;
    lastConnectionAfter?: string;
    lastConnectionBefore?: string;
    afterPublicId?: string;
    afterLastConnection?: string;
    take?: number;
}

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

export interface SanctionDto {
    publicId: string;
    kind: string;
    entitled: string;
    beginDate: string;
    endDate?: string | null;
    revokedAt?: string | null;
    modoPublicId: string;
    modoNickname: string;
    active: boolean;
}

export interface StaffUserDetailDto extends StaffUserDto {
    sanctions: SanctionDto[];
}

export interface CreateSanctionRequestDto {
    targetPublicId: string;
    kind: string;
    entitled: string;
    endDate?: string | null;
}

export interface UpdateSiteRoleRequestDto {
    targetPublicId: string;
    code: string;
}

export interface UpdateGameRoleRequestDto {
    targetPublicId: string;
    gameUrlValue: string;
    code?: string | null;
}

export interface CreateReportRequestDto {
    targetPublicId: string;
    reason: string;
    linkUrl?: string | null;
}

export interface ReportListRequestDto {
    status?: string;
    afterPublicId?: string;
    afterCreationDate?: string;
    take?: number;
}

export interface ReportDto {
    publicId: string;
    reporterPublicId: string;
    reporterNickname: string;
    reporterDiscriminator: string;
    targetPublicId: string;
    targetNickname: string;
    targetDiscriminator: string;
    targetAvatarUrl: string;
    reason: string;
    status: string;
    linkUrl?: string | null;
    creationDate: string;
}
