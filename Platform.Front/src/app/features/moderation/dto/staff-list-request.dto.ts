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
