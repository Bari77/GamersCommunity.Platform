export interface FriendDto {
    id: number;
    publicId: string;
    creationDate?: string;
    modificationDate?: string;
    idFriendAsking: number;
    idFriendReceive: number;
    idFriendStatus: number;
    peerId: number;
    peerPublicId: string;
    peerNickname: string;
    peerDiscriminator: string;
    peerAvatarUrl: string;
}
