/**
 * Destination a game route offers to the shell, be it a section or a search page. Declared in the
 * route `data` of the game, next to its breadcrumb, so the shell never has to load a remote to
 * know what that game offers.
 */
export interface GameLink {
    /** Absolute route, since a game declares its own prefix. */
    path: string;

    label: string;

    /** Selects a search type, for example `{ type: "guilds" }`. */
    queryParams?: Record<string, string>;

    /**
     * Path prefix that also lights this link. A guild sheet keeps Guilds active even though the
     * entry itself opens the search.
     */
    activePrefix?: string;
}
