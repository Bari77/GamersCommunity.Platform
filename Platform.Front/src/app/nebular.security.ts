export const accessControlGlobal = {
    admin: {
        view: ["admin_dashboard"],
        create: ["events"],
        close: ["events"],
    },
    moderator: {
        view: ["moderator_dashboard"],
    },
    user: {
        view: ["events"],
        join: ["events"],
    },
};
