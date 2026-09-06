import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { UsersStore } from "@features/users/stores/users.store";
import { catchError, firstValueFrom, of } from "rxjs";
import { EventRsvpStatusIdValue } from "../models/event-rsvp-status";
import { EventsUsersInterest } from "../models/events-users-interest.model";
import { EventsUsersInterestsService } from "../services/events-users-interests.service";

@Injectable({ providedIn: "root" })
export class EventsUsersInterestsStore {
    public readonly interests = resource({
        params: () => this.usersStore.isLoggedIn(),
        loader: ({ params: loggedIn }) => {
            if (!loggedIn) {
                return Promise.resolve([] as EventsUsersInterest[]);
            }
            return firstValueFrom(
                this.interestsService.list().pipe(catchError(() => of([] as EventsUsersInterest[]))),
            );
        },
        defaultValue: [] as EventsUsersInterest[],
    });

    public readonly loading = computed(() => this.interests.isLoading());
    public readonly saving = computed(() => this.$saving());

    private readonly $saving = signal(false);
    private readonly interestsService = inject(EventsUsersInterestsService);
    private readonly usersStore = inject(UsersStore);

    public reload(): void {
        if (!this.usersStore.isLoggedIn()) {
            return;
        }
        this.interests.reload();
    }

    public statusForEvent(idEvent: number): EventRsvpStatusIdValue | null {
        const match = this.interests.value().find((interest) => interest.idEvent === idEvent);
        return (match?.idStatus as EventRsvpStatusIdValue | undefined) ?? null;
    }

    public async upsert(idEvent: number, idStatus: EventRsvpStatusIdValue): Promise<void> {
        if (idEvent <= 0) {
            return;
        }

        this.$saving.set(true);
        try {
            await firstValueFrom(this.interestsService.upsert(idEvent, idStatus));
            this.reload();
        } finally {
            this.$saving.set(false);
        }
    }
}
