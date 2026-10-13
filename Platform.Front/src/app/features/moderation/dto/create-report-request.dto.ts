export interface CreateReportRequestDto {
    targetPublicId: string;
    reason: string;
    linkUrl?: string | null;
}
