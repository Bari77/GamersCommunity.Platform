import { Environment } from "@core/models/environment.model";

export const environment: Environment = {
    production: true,
    apiUrl: "",
    assetsBaseUrl: "https://host.bariserv.net/GamersCommunity",
    avatarMinId: 1,
    avatarMaxId: 12,
    idpUrl: "https://idp-gc.bariserv.net",
    idpAppSlug: "gc-front",
    idpClientId: "gc-front",
    idpEnrollmentFlow: "gc-enrollment",
    idpGoogleSourceSlug: "google",
};
