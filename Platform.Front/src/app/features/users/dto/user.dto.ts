export interface UserDto {
    id: number;
    publicId: string;
    nickname: string;
    discriminator: string;
    avatarUrl: string;
    mail: string;
    lastConnection: string;
    idKeycloak: string;
}
