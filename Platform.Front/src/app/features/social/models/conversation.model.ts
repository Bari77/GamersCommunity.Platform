import { parseUtcDate } from "@shared/utils/utc-date.util";
import { ConversationDto, ConversationMemberDto } from "../dto/conversation.dto";

export class ConversationMember {
    public constructor(
        public id: number,
        public publicId: string,
        public nickname: string,
        public discriminator: string,
        public avatarUrl: string,
        public isOwner: boolean,
        public joinedAt: Date,
    ) {}

    public static fromDto(dto: ConversationMemberDto): ConversationMember {
        return new ConversationMember(
            Number(dto.id),
            dto.publicId ?? "",
            dto.nickname,
            dto.discriminator,
            dto.avatarUrl ?? "",
            !!dto.isOwner,
            parseUtcDate(dto.joinedAt),
        );
    }
}

export class Conversation {
    public constructor(
        public publicId: string,
        public kind: "dm" | "group",
        public displayTitle: string,
        public title: string | null,
        public pictureUrl: string | null,
        public isOwner: boolean,
        public creationDate: Date,
        public lastMessage: string,
        public lastDate: Date | null,
        public unreadCount: number,
        public peerId: number | null,
        public peerPublicId: string,
        public peerNickname: string,
        public peerDiscriminator: string,
        public peerAvatarUrl: string,
        public members: ConversationMember[] = [],
    ) {}

    public get isGroup(): boolean {
        return this.kind === "group";
    }

    public static fromDto(dto: ConversationDto): Conversation {
        const kind = dto.kind === "group" ? "group" : "dm";
        return new Conversation(
            dto.publicId ?? "",
            kind,
            dto.displayTitle || dto.title || "",
            dto.title?.trim() ? dto.title : null,
            dto.pictureUrl?.trim() ? dto.pictureUrl : null,
            !!dto.isOwner,
            parseUtcDate(dto.creationDate),
            dto.lastMessage ?? "",
            dto.lastDate ? parseUtcDate(dto.lastDate) : null,
            Number(dto.unreadCount ?? 0),
            dto.peerId ? Number(dto.peerId) : null,
            dto.peerPublicId ? String(dto.peerPublicId) : "",
            dto.peerNickname ?? "",
            dto.peerDiscriminator ?? "",
            dto.peerAvatarUrl ?? "",
            (dto.members ?? []).map((member) => ConversationMember.fromDto(member)),
        );
    }

    public withUnreadCount(unreadCount: number): Conversation {
        return new Conversation(
            this.publicId,
            this.kind,
            this.displayTitle,
            this.title,
            this.pictureUrl,
            this.isOwner,
            this.creationDate,
            this.lastMessage,
            this.lastDate,
            unreadCount,
            this.peerId,
            this.peerPublicId,
            this.peerNickname,
            this.peerDiscriminator,
            this.peerAvatarUrl,
            this.members,
        );
    }

    public withPreview(content: string, date: Date): Conversation {
        return new Conversation(
            this.publicId,
            this.kind,
            this.displayTitle,
            this.title,
            this.pictureUrl,
            this.isOwner,
            this.creationDate,
            content,
            date,
            this.unreadCount,
            this.peerId,
            this.peerPublicId,
            this.peerNickname,
            this.peerDiscriminator,
            this.peerAvatarUrl,
            this.members,
        );
    }
}
