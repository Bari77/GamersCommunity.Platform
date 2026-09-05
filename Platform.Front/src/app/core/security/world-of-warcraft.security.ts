export const accessControlWow = {
    admin_wow: {
        view: ["wow_admin_dashboard", "wow_events"],
        join: ["wow_events"],
        create: ["wow_events"],
        close: ["wow_events"],
    },
    moderator_wow: {
        view: ["wow_moderator_dashboard", "wow_events"],
        join: ["wow_events"],
    },
    user: {
        join: ["events"],
    },
};
