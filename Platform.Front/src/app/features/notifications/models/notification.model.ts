import { parseUtcDate } from "@shared/utils/utc-date.util";
import { NotificationDto } from "../dto/notification.dto";
import { NotificationKind } from "./notification-kinds";

export class AppNotification {
    public constructor(
        public id: number,
        public publicId: string,
        public idUser: number,
        public kind: NotificationKind,
        public title: string,
        public body: string | null,
        public linkUrl: string | null,
        public isRead: boolean,
        public payloadJson: string | null,
        public creationDate: Date,
    ) {}

    public static fromDto(dto: NotificationDto): AppNotification {
        return new AppNotification(
            dto.id,
            dto.publicId,
            dto.idUser,
            dto.kind,
            dto.title,
            dto.body ?? null,
            dto.linkUrl ?? null,
            dto.isRead,
            dto.payloadJson ?? null,
            parseUtcDate(dto.creationDate),
        );
    }

    public withRead(isRead = true): AppNotification {
        return new AppNotification(
            this.id,
            this.publicId,
            this.idUser,
            this.kind,
            this.title,
            this.body,
            this.linkUrl,
            isRead,
            this.payloadJson,
            this.creationDate,
        );
    }
}
