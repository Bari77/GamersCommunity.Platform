import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { catchError, map, Observable, of } from "rxjs";
import { toGameApiSegment } from "../utils/game-url.util";

interface GatewayAvailabilityDto {
    items?: { id: string; available: boolean }[];
}

@Injectable({ providedIn: "root" })
export class GameAvailabilityService {
    private readonly http = inject(HttpClient);

    public list(): Observable<Map<string, boolean>> {
        return this.http.get<GatewayAvailabilityDto>(`${environment.apiUrl}/gateway/availability`).pipe(
            map((dto) => {
                const statuses = new Map<string, boolean>();
                for (const item of dto.items ?? []) {
                    statuses.set(item.id.toLowerCase(), item.available);
                }
                return statuses;
            }),
            catchError(() => of(new Map<string, boolean>())),
        );
    }

    public static isAvailable(statuses: Map<string, boolean>, urlValue: string): boolean {
        const status = statuses.get(toGameApiSegment(urlValue).toLowerCase());
        return status !== false;
    }
}
