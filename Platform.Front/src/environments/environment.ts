import { Environment } from "@core/models/environment.model";

export const environment: Environment = {
    production: false,
    apiUrl: "http://localhost:5000/api",
    hubUrl: "http://localhost:5000/hubs/messenger",
    assetsBaseUrl: "https://host.bariserv.net/GamersCommunity",
    avatarMinId: 1,
    avatarMaxId: 12,
    idpUrl: "http://localhost:9000",
    idpAppSlug: "gc-front",
    idpClientId: "gc-front",
    idpEnrollmentFlow: "gc-enrollment",
    idpGoogleSourceSlug: "google",
};
