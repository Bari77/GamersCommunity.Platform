import { ApiHealthDto } from "@core/dto/health.dto";

export class ApiHealth {
    public constructor(public status: string) {}

    public static fromDto(dto: ApiHealthDto): ApiHealth {
        return new ApiHealth(dto.status);
    }
}
