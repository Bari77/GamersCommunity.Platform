export interface PublicUserDto {
    id: number;
    publicId: string;
    nickname: string;
    discriminator: string;
    avatarUrl: string;
    lastConnection?: string | null;
}
