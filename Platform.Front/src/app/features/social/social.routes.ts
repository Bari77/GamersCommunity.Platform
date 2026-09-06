import { Routes } from "@angular/router";
import { AuthGuard } from "@core/guards/auth.guard";

export const socialRoutes: Routes = [
    {
        path: "friends",
        loadComponent: () =>
            import("./pages/friends/friends.component").then((m) => m.FriendsComponent),
        canActivate: [AuthGuard],
    },
    {
        path: "messages",
        loadComponent: () =>
            import("./pages/messages/messages.component").then((m) => m.MessagesComponent),
        canActivate: [AuthGuard],
    },
];
