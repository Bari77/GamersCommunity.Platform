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
    ) {}

    public static fromDto(dto: MessageDto): DirectMessage {
        return new DirectMessage(
            Number(dto.id),
            String(dto.publicId),
            dto.content,
            Number(dto.idSender),
            Number(dto.idReceiver),
            new Date(dto.creationDate),
            dto.isRead ?? false,
            Number(dto.unreadCount ?? 0),
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
        );
    }
}
