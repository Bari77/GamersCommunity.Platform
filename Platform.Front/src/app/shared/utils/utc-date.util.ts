const HAS_TIMEZONE = /[zZ]|[+-]\d{2}:?\d{2}$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseUtcDate(value: string | Date | number | null | undefined): Date {
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
        return new Date(value);
    }
    if (typeof value !== "string") {
        return new Date(Number.NaN);
    }

    const raw = value.trim();
    if (!raw) {
        return new Date(Number.NaN);
    }
    if (HAS_TIMEZONE.test(raw)) {
        return new Date(raw);
    }
    if (DATE_ONLY.test(raw)) {
        return new Date(`${raw}T00:00:00Z`);
    }
    return new Date(`${raw}Z`);
}

export function parseUtcDateOrNull(value: string | Date | number | null | undefined): Date | null {
    if (value == null || value === "") {
        return null;
    }
    const date = parseUtcDate(value);
    return Number.isNaN(date.getTime()) ? null : date;
}
