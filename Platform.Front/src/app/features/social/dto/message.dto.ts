export interface MessageDto {
    id: number;
    publicId: string;
    content: string;
    idSender: number;
    idReceiver: number;
    isRead?: boolean;
    creationDate: string;
}
