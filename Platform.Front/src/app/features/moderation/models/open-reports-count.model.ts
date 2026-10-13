export class OpenReportsCount {
    public constructor(public openCount: number) {}

    public static fromDto(dto: { openCount?: number }): OpenReportsCount {
        return new OpenReportsCount(dto.openCount ?? 0);
    }
}
