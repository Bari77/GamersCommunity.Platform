import { parseUtcDate } from "@shared/utils/utc-date.util";
import { ConversationMemberDto } from "../dto/conversation-member.dto";

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
