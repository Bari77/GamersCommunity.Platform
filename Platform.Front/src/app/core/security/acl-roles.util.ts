export interface GameRoleAssignment {
    gameUrlValue: string;
    code: string;
}

export function gameAclSuffix(urlValue: string): string {
    const slug = urlValue.replace(/^\/+/, "").toLowerCase();
    if (slug === "world-of-warcraft") {
        return "wow";
    }
    return slug.replace(/-/g, "_");
}

export function toAclRoles(siteRoles: string[], gameRoles: GameRoleAssignment[]): string[] {
    const roles = new Set<string>(["user"]);

    if (siteRoles.some((role) => role.toLowerCase() === "admin")) {
        roles.add("admin");
        roles.add("moderator");
    } else if (siteRoles.some((role) => role.toLowerCase() === "moderator")) {
        roles.add("moderator");
    }

    for (const assignment of gameRoles) {
        const suffix = gameAclSuffix(assignment.gameUrlValue);
        const code = assignment.code.toLowerCase();
        if (code === "admin") {
            roles.add(`admin_${suffix}`);
            roles.add(`moderator_${suffix}`);
        } else if (code === "moderator") {
            roles.add(`moderator_${suffix}`);
        }
    }

    return [...roles];
}
