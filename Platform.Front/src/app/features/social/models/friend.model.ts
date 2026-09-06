import { FriendDto } from "../dto/friend.dto";

export class Friend {
    public constructor(
        public id: number,
        public publicId: string,
        public idFriendAsking: number,
        public idFriendReceive: number,
        public idFriendStatus: number,
        public modificationDate: Date,
        public peerId: number,
        public peerPublicId: string,
        public peerNickname: string,
        public peerDiscriminator: string,
        public peerAvatarUrl: string,
    ) {}

    public get peerLabel(): string {
        return `${this.peerNickname}#${this.peerDiscriminator}`;
    }

    public static fromDto(dto: FriendDto): Friend {
        return new Friend(
            Number(dto.id),
            dto.publicId,
            Number(dto.idFriendAsking),
            Number(dto.idFriendReceive),
            Number(dto.idFriendStatus),
            dto.modificationDate ? new Date(dto.modificationDate) : new Date(0),
            Number(dto.peerId),
            dto.peerPublicId,
            dto.peerNickname,
            dto.peerDiscriminator,
            dto.peerAvatarUrl ?? "",
        );
    }
}
