export const accessControlGlobal = {
    admin: {
        view: ["admin_dashboard", "moderation"],
        create: ["events"],
        close: ["events"],
    },
    moderator: {
        view: ["moderator_dashboard", "moderation"],
    },
    user: {
        view: ["events"],
        join: ["events"],
    },
};
