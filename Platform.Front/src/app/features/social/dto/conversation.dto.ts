export interface ConversationMemberDto {
    id: number;
    publicId: string;
    nickname: string;
    discriminator: string;
    avatarUrl: string;
    isOwner: boolean;
    joinedAt: string;
}

export interface ConversationDto {
    publicId: string;
    kind: "dm" | "group" | string;
    title?: string | null;
    displayTitle: string;
    pictureUrl?: string | null;
    idOwner?: number | null;
    isOwner: boolean;
    creationDate: string;
    lastMessage?: string | null;
    lastDate?: string | null;
    unreadCount?: number;
    peerId?: number | null;
    peerPublicId?: string | null;
    peerNickname?: string | null;
    peerDiscriminator?: string | null;
    peerAvatarUrl?: string | null;
    members?: ConversationMemberDto[];
}
