import { Component, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { NbButtonModule } from "@nebular/theme";
import { ModerationReportsBadgeStore } from "../../stores/moderation-reports-badge.store";

@Component({
    standalone: true,
    selector: "app-moderation-nav",
    imports: [RouterLink, NbButtonModule],
    templateUrl: "./moderation-nav.component.html",
    styleUrl: "./moderation-nav.component.scss",
})
export class ModerationNavComponent {
    public readonly active = input<"users" | "reports">("users");
    public readonly reportsBadge = inject(ModerationReportsBadgeStore);
}
