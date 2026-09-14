import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive } from "@angular/router";
import { BreadcrumbComponent } from "@bari77/gc-ui";
import { NbFormFieldModule, NbIconModule, NbInputModule } from "@nebular/theme";

/**
 * Destination a game route offers to the shell, be it a section or a search page. Declared in the
 * route `data` of the game, next to its breadcrumb, so the shell never has to load a remote to
 * know what that game offers.
 */
export interface GameLink {
    /** Absolute route, since a game declares its own prefix. */
    path: string;

    label: string;
}

interface ContextBarState {
    hasTrail: boolean;
    nav: GameLink[];
    search: GameLink | null;
}

function isGameLink(value: unknown): value is GameLink {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as GameLink).path === "string" &&
        typeof (value as GameLink).label === "string"
    );
}

function isGameLinkList(value: unknown): value is GameLink[] {
    return Array.isArray(value) && value.every(isGameLink);
}

/**
 * Secondary bar pinned under the header, holding the navigation trail and, inside a game, the
 * sections and the search of that game.
 *
 * It collapses when it has nothing to show, so pages at the site root keep their full height.
 */
@Component({
    standalone: true,
    selector: "app-context-bar",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        RouterLink,
        RouterLinkActive,
        BreadcrumbComponent,
        NbFormFieldModule,
        NbIconModule,
        NbInputModule,
    ],
    templateUrl: "./context-bar.component.html",
    styleUrl: "./context-bar.component.scss",
    host: {
        "[class.context-bar--empty]": "!hasTrail() && !gameSearch() && gameNav().length === 0",
    },
})
export class ContextBarComponent {
    protected readonly homeLabel = $localize`:@@core.breadcrumb.home:Home`;
    protected readonly navLabel = $localize`:@@core.contextBar.sections:Game sections`;
    protected readonly term = signal("");

    private readonly router = inject(Router);
    private readonly state = signal<ContextBarState>(this.read());

    protected readonly hasTrail = computed(() => this.state().hasTrail);
    protected readonly gameNav = computed(() => this.state().nav);
    protected readonly gameSearch = computed(() => this.state().search);

    public constructor() {
        const subscription = this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.state.set(this.read());
                this.syncTerm();
            }
        });

        inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
    }

    protected submit(): void {
        const target = this.gameSearch();
        const term = this.term().trim();

        if (!target || !term) {
            return;
        }

        void this.router.navigate([target.path], { queryParams: { q: term } });
    }

    private read(): ContextBarState {
        let snapshot: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
        let hasTrail = false;
        let nav: GameLink[] = [];
        let search: GameLink | null = null;

        while (snapshot) {
            // Read the raw route config rather than `snapshot.data`, as `gc-breadcrumb` does: the
            // latter inherits its parent's data across empty-path routes.
            const data = snapshot.routeConfig?.data;
            const label: unknown = data?.["breadcrumb"];

            if (typeof label === "string" && label.length > 0) {
                hasTrail = true;
            }

            if (isGameLinkList(data?.["gameNav"])) {
                nav = data["gameNav"];
            }

            if (isGameLink(data?.["gameSearch"])) {
                search = data["gameSearch"];
            }

            snapshot = snapshot.firstChild;
        }

        return { hasTrail, nav, search };
    }

    /** Leaves the field untouched outside the search page, so a result click keeps the term typed. */
    private syncTerm(): void {
        const target = this.state().search;

        if (!target || !this.router.url.split("?")[0].startsWith(target.path)) {
            return;
        }

        this.term.set(this.router.routerState.snapshot.root.queryParamMap.get("q") ?? "");
    }
}
