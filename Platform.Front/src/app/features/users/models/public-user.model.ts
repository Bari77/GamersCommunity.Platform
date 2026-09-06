import { parseUtcDateOrNull } from "@shared/utils/utc-date.util";
import { PublicUserDto } from "../dto/public-user.dto";

export class PublicUser {
    public constructor(
        public id: number,
        public publicId: string,
        public nickname: string,
        public discriminator: string,
        public avatarUrl: string,
        public lastConnection: Date | null,
    ) {}

    public get fullNickname(): string {
        return `${this.nickname}#${this.discriminator}`;
    }

    public static fromDto(dto: PublicUserDto): PublicUser {
        return new PublicUser(
            dto.id,
            dto.publicId,
            dto.nickname,
            dto.discriminator,
            dto.avatarUrl,
            parseUtcDateOrNull(dto.lastConnection),
        );
    }
}
