export interface NotificationDto {
    id: number;
    publicId: string;
    idUser: number;
    kind: string;
    title: string;
    body?: string | null;
    linkUrl?: string | null;
    isRead: boolean;
    payloadJson?: string | null;
    creationDate: string;
}
