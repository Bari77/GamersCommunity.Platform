import { Routes } from "@angular/router";

export const eventsRoutes: Routes = [
    {
        path: "",
        loadComponent: () => import("./pages/events-list/events-list.component").then((m) => m.EventsListComponent),
    },
    {
        path: ":publicId",
        data: { breadcrumb: $localize`:@@core.breadcrumb.event:Event` },
        loadComponent: () => import("./pages/event-detail/event-detail.component").then((m) => m.EventDetailComponent),
    },
];
