import { parseUtcDate } from "@shared/utils/utc-date.util";
import { MessageDto } from "../dto/message.dto";

export class DirectMessage {
    public constructor(
        public id: number,
        public publicId: string,
        public content: string,
        public idSender: number,
        public idReceiver: number,
        public creationDate: Date,
        public isRead: boolean = false,
        public unreadCount: number = 0,
        public parentMessageId: number | null = null,
        public parentContent: string | null = null,
    ) {}

    public static fromDto(dto: MessageDto): DirectMessage {
        const parentMessageId = dto.parentMessageId != null ? Number(dto.parentMessageId) : NaN;
        return new DirectMessage(
            Number(dto.id),
            String(dto.publicId),
            dto.content,
            Number(dto.idSender),
            Number(dto.idReceiver),
            parseUtcDate(dto.creationDate),
            dto.isRead ?? false,
            Number(dto.unreadCount ?? 0),
            Number.isFinite(parentMessageId) && parentMessageId > 0 ? parentMessageId : null,
            dto.parentContent?.trim() ? dto.parentContent : null,
        );
    }

    public withRead(isRead = true): DirectMessage {
        return new DirectMessage(
            this.id,
            this.publicId,
            this.content,
            this.idSender,
            this.idReceiver,
            this.creationDate,
            isRead,
            isRead ? 0 : this.unreadCount,
            this.parentMessageId,
            this.parentContent,
        );
    }

    public withUnreadCount(unreadCount: number): DirectMessage {
        return new DirectMessage(
            this.id,
            this.publicId,
            this.content,
            this.idSender,
            this.idReceiver,
            this.creationDate,
            this.isRead,
            unreadCount,
            this.parentMessageId,
            this.parentContent,
        );
    }
}
