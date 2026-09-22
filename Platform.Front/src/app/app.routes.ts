import { Routes } from "@angular/router";
import { GameRemoteShellComponent } from "@core/federation/components/game-remote-shell/game-remote-shell.component";
import { loadRemoteRoutes } from "@core/federation/load-remote-routes";
import { HomeContainerComponent } from "./features/home/pages/home-container/home-container.component";

export const appRoutes: Routes = [
    {
        path: "",
        redirectTo: "/home",
        pathMatch: "full",
    },
    {
        path: "auth",
        loadChildren: () => import("./features/auth/auth.routes").then((r) => r.authRoutes),
    },
    {
        path: "home",
        component: HomeContainerComponent,
    },
    {
        path: "events",
        data: { breadcrumb: $localize`:@@core.breadcrumb.events:Events` },
        loadChildren: () => import("./features/events/events.routes").then((r) => r.eventsRoutes),
    },
    {
        path: "social",
        loadChildren: () => import("./features/social/social.routes").then((r) => r.socialRoutes),
    },
    {
        path: "users",
        loadChildren: () => import("./features/users/users.routes").then((r) => r.usersRoutes),
    },
    {
        path: "moderation",
        data: { breadcrumb: $localize`:@@core.breadcrumb.moderation:Moderation` },
        loadChildren: () => import("./features/moderation/moderation.routes").then((r) => r.moderationRoutes),
    },
    {
        path: "world-of-warcraft",
        component: GameRemoteShellComponent,
        data: {
            breadcrumb: "World of Warcraft",
            gameNav: [
                {
                    path: "/world-of-warcraft/sheet",
                    label: $localize`:@@core.contextBar.nav.sheet:My profile`,
                },
                {
                    path: "/world-of-warcraft/guilds",
                    label: $localize`:@@core.contextBar.nav.guilds:Guilds`,
                },
            ],
            gameSearch: {
                path: "/world-of-warcraft/search",
                label: $localize`:@@core.contextBar.search.worldOfWarcraft:Search a character, a player or a guild`,
            },
        },
        loadChildren: () => loadRemoteRoutes("worldOfWarcraft", "./Routes", "worldOfWarcraftRoutes"),
    },
    {
        path: "league-of-legends",
        component: GameRemoteShellComponent,
        data: {
            breadcrumb: "League of Legends",
            gameNav: [
                {
                    path: "/league-of-legends/sheet",
                    label: $localize`:@@core.contextBar.nav.sheet:My profile`,
                },
            ],
        },
        loadChildren: () => loadRemoteRoutes("leagueOfLegends", "./Routes", "leagueOfLegendsRoutes"),
    },
    {
        path: "offline",
        loadComponent: () =>
            import("@core/layout/splash/components/offline/offline.component").then((m) => m.OfflineComponent),
    },
    {
        path: "**",
        redirectTo: "/home",
    },
];
