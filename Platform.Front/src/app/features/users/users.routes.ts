import { Routes } from "@angular/router";
import { AuthGuard } from "@core/guards/auth.guard";
import { UnauthGuard } from "@core/guards/unauth.guard";

export const usersRoutes: Routes = [
    {
        path: "login",
        loadComponent: () => import("./pages/login/login.component").then((m) => m.LoginComponent),
        canActivate: [UnauthGuard],
    },
    {
        path: "logout",
        loadComponent: () => import("./pages/logout/logout.component").then((m) => m.LogoutComponent),
    },
    {
        path: "profile",
        loadComponent: () => import("./pages/profile/profile.component").then((m) => m.ProfileComponent),
        canActivate: [AuthGuard],
    },
    {
        path: "search",
        loadComponent: () =>
            import("./pages/user-search/user-search.component").then((m) => m.UserSearchComponent),
    },
    {
        path: ":publicId",
        loadComponent: () =>
            import("./pages/user-profile/user-profile.component").then((m) => m.UserProfileComponent),
    },
];
