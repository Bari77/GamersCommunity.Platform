import { Routes } from "@angular/router";
import { loadRemoteRoutes } from "@core/federation/load-remote-routes";

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
        loadChildren: () => import("./features/home/home.routes").then((r) => r.homeRoutes),
    },
    {
        path: "users",
        loadChildren: () => import("./features/users/users.routes").then((r) => r.usersRoutes),
    },
    {
        path: "world-of-warcraft",
        loadChildren: () =>
            loadRemoteRoutes("worldOfWarcraft", "./Routes", (m) => m["worldOfWarcraftRoutes"] as Routes),
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
