import { parseUtcDate } from "@shared/utils/utc-date.util";
import { MessageDto } from "../dto/message.dto";

export class DirectMessage {
    public constructor(
        public publicId: string,
        public content: string,
        public idSender: number,
        public idReceiver: number,
        public creationDate: Date,
        public isRead: boolean = false,
        public unreadCount: number = 0,
        public parentPublicId: string | null = null,
        public parentContent: string | null = null,
    ) {}

    public static fromDto(dto: MessageDto): DirectMessage {
        const parentPublicId = dto.parentPublicId?.trim() || "";
        return new DirectMessage(
            String(dto.publicId),
            dto.content,
            Number(dto.idSender),
            Number(dto.idReceiver),
            parseUtcDate(dto.creationDate),
            dto.isRead ?? false,
            Number(dto.unreadCount ?? 0),
            parentPublicId || null,
            dto.parentContent?.trim() ? dto.parentContent : null,
        );
    }

    public withRead(isRead = true): DirectMessage {
        return new DirectMessage(
            this.publicId,
            this.content,
            this.idSender,
            this.idReceiver,
            this.creationDate,
            isRead,
            isRead ? 0 : this.unreadCount,
            this.parentPublicId,
            this.parentContent,
        );
    }

    public withUnreadCount(unreadCount: number): DirectMessage {
        return new DirectMessage(
            this.publicId,
            this.content,
            this.idSender,
            this.idReceiver,
            this.creationDate,
            this.isRead,
            unreadCount,
            this.parentPublicId,
            this.parentContent,
        );
    }
}
