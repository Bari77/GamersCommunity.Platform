import { EventDto } from "../dto/event.dto";

export class CommunityEvent {
    public constructor(
        public id: number,
        public publicId: string,
        public title: string,
        public beginDate: Date,
        public endDate: Date,
        public description: string,
        public image: string | null,
        public link: string | null,
        public places: number | null,
        public active: boolean,
    ) {}

    public static fromDto(dto: EventDto): CommunityEvent {
        return new CommunityEvent(
            dto.id,
            dto.publicId,
            dto.title,
            new Date(dto.beginDate),
            new Date(dto.endDate),
            dto.description,
            dto.image ?? null,
            dto.link ?? null,
            dto.places ?? null,
            dto.active,
        );
    }
}
