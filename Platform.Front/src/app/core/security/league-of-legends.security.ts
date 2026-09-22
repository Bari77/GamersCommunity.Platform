export const accessControlLol = {
    admin_lol: {
        view: ["lol_admin_dashboard", "lol_events"],
        join: ["lol_events"],
        create: ["lol_events"],
        close: ["lol_events"],
    },
    moderator_lol: {
        view: ["lol_moderator_dashboard", "lol_events"],
        join: ["lol_events"],
    },
};
