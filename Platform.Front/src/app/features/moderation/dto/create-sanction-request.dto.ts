export interface CreateSanctionRequestDto {
    targetPublicId: string;
    kind: string;
    entitled: string;
    endDate?: string | null;
}
