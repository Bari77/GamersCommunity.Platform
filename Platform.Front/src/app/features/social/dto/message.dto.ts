export interface MessageDto {
    id: number;
    publicId: string;
    content: string;
    idSender: number;
    idReceiver: number;
    isRead?: boolean;
    creationDate: string;
    unreadCount?: number;
    parentMessageId?: number | null;
    parentContent?: string | null;
}
