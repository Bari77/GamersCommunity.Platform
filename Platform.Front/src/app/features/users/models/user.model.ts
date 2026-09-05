import { UserDto } from "../dto/user.dto";

export class User {
    public constructor(
        public id: number,
        public publicId: string,
        public nickname: string,
        public discriminator: string,
        public avatarUrl: string,
        public mail: string,
        public lastConnection: Date,
        public idKeycloak: string,
    ) {}

    public static fromDto(dto: UserDto): User {
        return new User(
            dto.id,
            dto.publicId,
            dto.nickname,
            dto.discriminator,
            dto.avatarUrl,
            dto.mail,
            new Date(dto.lastConnection),
            dto.idKeycloak,
        );
    }
}
