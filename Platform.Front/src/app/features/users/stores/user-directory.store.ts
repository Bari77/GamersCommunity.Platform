import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { catchError, firstValueFrom, of } from "rxjs";
import { PublicUser } from "../models/public-user.model";
import { UsersService } from "../users.service";

@Injectable({ providedIn: "root" })
export class UserDirectoryStore {
    public readonly results = resource({
        params: () => this.$query(),
        loader: ({ params }) => {
            const query = params.trim();
            if (query.length < 1) {
                return Promise.resolve([] as PublicUser[]);
            }
            return firstValueFrom(this.usersService.search(query).pipe(catchError(() => of([] as PublicUser[]))));
        },
        defaultValue: [] as PublicUser[],
    });

    public readonly selected = resource({
        params: () => this.$publicId(),
        loader: ({ params }) => {
            if (!params) {
                return Promise.resolve(undefined);
            }
            return firstValueFrom(this.usersService.getUser(params)).catch(() => undefined);
        },
        defaultValue: undefined as PublicUser | undefined,
    });

    public readonly query = computed(() => this.$query());
    public readonly searchLoading = computed(() => this.results.isLoading());
    public readonly profileLoading = computed(() => this.selected.isLoading());

    private readonly usersService = inject(UsersService);
    private readonly $query = signal("");
    private readonly $publicId = signal<string | null>(null);

    public search(query: string): void {
        this.$query.set(query.trim());
    }

    public selectByPublicId(publicId: string): void {
        this.$publicId.set(publicId);
    }

    public clearSelection(): void {
        this.$publicId.set(null);
    }
}
