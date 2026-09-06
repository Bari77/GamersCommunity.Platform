import { EventsUsersInterestDto } from "../dto/events-users-interest.dto";

export class EventsUsersInterest {
    public constructor(
        public id: number,
        public publicId: string,
        public idEvent: number,
        public idUser: number,
        public idStatus: number,
    ) {}

    public static fromDto(dto: EventsUsersInterestDto): EventsUsersInterest {
        return new EventsUsersInterest(dto.id, dto.publicId, dto.idEvent, dto.idUser, dto.idStatus);
    }
}
