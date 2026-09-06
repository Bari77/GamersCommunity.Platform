import { parseUtcDate } from "@shared/utils/utc-date.util";
import { MessageDto } from "../dto/message.dto";

export type MessageDelivery = "sent" | "pending" | "failed";

export class DirectMessage {
    public constructor(
        public publicId: string,
        public conversationPublicId: string,
        public content: string,
        public idSender: number,
        public senderPublicId: string,
        public senderNickname: string,
        public senderDiscriminator: string,
        public senderAvatarUrl: string,
        public creationDate: Date,
        public parentPublicId: string | null = null,
        public parentContent: string | null = null,
        public delivery: MessageDelivery = "sent",
    ) {}

    public get isLocal(): boolean {
        return this.delivery !== "sent";
    }

    public static fromDto(dto: MessageDto): DirectMessage {
        const parentPublicId = DirectMessage.text(dto.parentPublicId).trim();
        const parentContent = DirectMessage.text(dto.parentContent).trim();
        return new DirectMessage(
            DirectMessage.text(dto.publicId),
            DirectMessage.text(dto.conversationPublicId),
            DirectMessage.text(dto.content),
            Number(dto.idSender),
            DirectMessage.text(dto.senderPublicId),
            DirectMessage.text(dto.senderNickname),
            DirectMessage.text(dto.senderDiscriminator),
            DirectMessage.text(dto.senderAvatarUrl),
            parseUtcDate(dto.creationDate),
            parentPublicId || null,
            parentContent || null,
        );
    }

    public static fromList(body: unknown): DirectMessage[] {
        return DirectMessage.unwrapDtos(body).map((dto) => DirectMessage.fromDto(dto));
    }

    private static unwrapDtos(body: unknown): MessageDto[] {
        if (body == null || body === "") {
            return [];
        }
        if (typeof body === "string") {
            const trimmed = body.trim();
            if (!trimmed) {
                return [];
            }
            return DirectMessage.unwrapDtos(JSON.parse(trimmed) as unknown);
        }
        if (Array.isArray(body)) {
            return body as MessageDto[];
        }
        if (typeof body === "object" && "data" in body) {
            return DirectMessage.unwrapDtos((body as { data: unknown }).data);
        }
        return [body as MessageDto];
    }

    private static text(value: unknown): string {
        if (typeof value === "string") {
            return value;
        }
        if (value == null) {
            return "";
        }
        return String(value);
    }

    public withDelivery(delivery: MessageDelivery): DirectMessage {
        return new DirectMessage(
            this.publicId,
            this.conversationPublicId,
            this.content,
            this.idSender,
            this.senderPublicId,
            this.senderNickname,
            this.senderDiscriminator,
            this.senderAvatarUrl,
            this.creationDate,
            this.parentPublicId,
            this.parentContent,
            delivery,
        );
    }

    public withPublicId(publicId: string): DirectMessage {
        return new DirectMessage(
            publicId,
            this.conversationPublicId,
            this.content,
            this.idSender,
            this.senderPublicId,
            this.senderNickname,
            this.senderDiscriminator,
            this.senderAvatarUrl,
            this.creationDate,
            this.parentPublicId,
            this.parentContent,
            this.delivery,
        );
    }
}
