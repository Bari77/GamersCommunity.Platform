export interface GuildChannelCrest {
    assetsOrigin: string;
    faction: "alliance" | "horde";
    emblem: number;
    emblemColor: string;
    border: number;
    borderColor: string;
    backgroundColor: string;
}

const PREFIX = "wow-crest:v1|";

export function parseGuildChannelCrest(pictureUrl: string | null | undefined): GuildChannelCrest | null {
    const raw = pictureUrl?.trim() ?? "";
    if (!raw.startsWith(PREFIX)) {
        return null;
    }

    const parts = raw.slice(PREFIX.length).split("|");
    if (parts.length !== 7) {
        return null;
    }

    const [assetsOrigin, factionRaw, emblemRaw, emblemColor, borderRaw, borderColor, backgroundColor] = parts;
    const origin = assetsOrigin.replace(/\/+$/, "");
    if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
        return null;
    }

    const emblem = Number(emblemRaw);
    const border = Number(borderRaw);
    if (!Number.isInteger(emblem) || emblem < 0 || !Number.isInteger(border) || border < 0) {
        return null;
    }

    if (![emblemColor, borderColor, backgroundColor].every(isHexColor)) {
        return null;
    }

    return {
        assetsOrigin: origin,
        faction: factionRaw.toLowerCase() === "horde" ? "horde" : "alliance",
        emblem,
        emblemColor,
        border,
        borderColor,
        backgroundColor,
    };
}

function isHexColor(value: string): boolean {
    return /^#[0-9a-f]{6}$/i.test(value);
}
