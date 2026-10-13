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
