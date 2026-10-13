export interface ConversationMemberDto {
    id: number;
    publicId: string;
    nickname: string;
    discriminator: string;
    avatarUrl: string;
    isOwner: boolean;
    joinedAt: string;
}
