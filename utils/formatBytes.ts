// Human-readable byte size, e.g. 1536 -> "1.5 KB". Returns '' for 0/undefined.
export const formatBytes = (bytes: number): string => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 10) / 10} ${sizes[i]}`;
};

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
];

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

// Human-readable age, e.g. "10 minutes ago" / "yesterday", from an ISO-8601 timestamp.
export const formatRelativeTime = (isoTimestamp?: string | null): string => {
    if (!isoTimestamp) return 'never';

    const then = Date.parse(isoTimestamp);
    if (Number.isNaN(then)) return 'never';

    const elapsed = Date.now() - then;
    for (const [unit, ms] of RELATIVE_UNITS) {
        if (Math.abs(elapsed) >= ms) {
            return rtf.format(-Math.round(elapsed / ms), unit);
        }
    }
    return 'just now';
};
