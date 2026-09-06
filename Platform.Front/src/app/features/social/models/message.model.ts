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
    ) {}

    public static fromDto(dto: MessageDto): DirectMessage {
        return new DirectMessage(
            dto.id,
            dto.publicId,
            dto.content,
            dto.idSender,
            dto.idReceiver,
            new Date(dto.creationDate),
            dto.isRead ?? false,
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
        );
    }
}
