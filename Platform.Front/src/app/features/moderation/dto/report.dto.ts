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
