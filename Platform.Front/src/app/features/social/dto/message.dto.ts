export interface MessageDto {
    publicId: string;
    conversationPublicId: string;
    content: string;
    idSender: number;
    senderPublicId: string;
    senderNickname: string;
    senderDiscriminator: string;
    senderAvatarUrl: string;
    creationDate: string;
    parentPublicId?: string | null;
    parentContent?: string | null;
}
