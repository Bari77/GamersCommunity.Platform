import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { catchError, firstValueFrom, of } from "rxjs";
import { CommunityEvent } from "../models/event.model";
import { EventsService } from "../services/events.service";

@Injectable({ providedIn: "root" })
export class EventsStore {
    public readonly events = resource({
        loader: () =>
            firstValueFrom(this.eventsService.list().pipe(catchError(() => of([] as CommunityEvent[])))),
        defaultValue: [] as CommunityEvent[],
    });

    public readonly selectedEvent = resource({
        params: () => this.$selectedPublicId(),
        loader: ({ params }) => {
            if (!params) {
                return Promise.resolve(undefined);
            }
            return firstValueFrom(this.eventsService.getByPublicId(params)).catch(() => undefined);
        },
        defaultValue: undefined as CommunityEvent | undefined,
    });

    public readonly listLoading = computed(() => this.events.isLoading());
    public readonly detailLoading = computed(() => this.selectedEvent.isLoading());

    private readonly eventsService = inject(EventsService);
    private readonly $selectedPublicId = signal<string | null>(null);

    public reload(): void {
        this.events.reload();
    }

    public selectByPublicId(publicId: string): void {
        this.$selectedPublicId.set(publicId);
    }

    public clearSelection(): void {
        this.$selectedPublicId.set(null);
    }
}
