export interface Environment {
    production: boolean;
    apiUrl: string;
    assetsBaseUrl: string;
    avatarMinId: number;
    avatarMaxId: number;
    idpUrl: string;
    idpAppSlug: string;
    idpClientId: string;
    idpEnrollmentFlow: string;
    idpGoogleSourceSlug: string;
}
