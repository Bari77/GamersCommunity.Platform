export interface MessageDto {
    publicId: string;
    content: string;
    idSender: number;
    idReceiver: number;
    isRead?: boolean;
    creationDate: string;
    unreadCount?: number;
    parentPublicId?: string | null;
    parentContent?: string | null;
}
