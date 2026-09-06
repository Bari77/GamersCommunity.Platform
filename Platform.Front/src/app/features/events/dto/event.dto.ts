export interface EventDto {
    id: number;
    publicId: string;
    title: string;
    beginDate: string;
    endDate: string;
    description: string;
    image?: string | null;
    link?: string | null;
    places?: number | null;
    active: boolean;
}
