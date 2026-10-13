import { Routes } from "@angular/router";
import { AuthGuard } from "@core/guards/auth.guard";

export const socialRoutes: Routes = [
    {
        path: "friends",
        data: { breadcrumb: $localize`:@@core.breadcrumb.friends:Friends` },
        loadComponent: () => import("./pages/friends/friends.component").then((m) => m.FriendsComponent),
        canActivate: [AuthGuard],
    },
];
