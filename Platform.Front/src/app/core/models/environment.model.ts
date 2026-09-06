export interface Environment {
    production: boolean;
    apiUrl: string;
    hubUrl: string;
    assetsBaseUrl: string;
    avatarMinId: number;
    avatarMaxId: number;
    groupAvatarMinId: number;
    groupAvatarMaxId: number;
    idpUrl: string;
    idpAppSlug: string;
    idpClientId: string;
    idpEnrollmentFlow: string;
    idpGoogleSourceSlug: string;
}
