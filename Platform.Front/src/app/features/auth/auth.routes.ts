import { Routes } from "@angular/router";

export const authRoutes: Routes = [
    {
        path: "callback",
        loadComponent: () => import("./pages/callback/callback.component").then((m) => m.CallbackComponent),
    },
];
