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

const AVATAR_COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0d9488', '#4f46e5'];
const AVATAR_SIZE = 128;

export const generateDefaultLogo = (name: string): string => {
    if (typeof document === 'undefined') return '';
    const trimmed = name.trim();
    if (!trimmed) return '';

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const hash = [...trimmed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    ctx.fillStyle = AVATAR_COLORS[hash % AVATAR_COLORS.length];
    ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${AVATAR_SIZE / 2.3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = [...trimmed].slice(0, 2).join('').toUpperCase();
    ctx.fillText(initials, AVATAR_SIZE / 2, AVATAR_SIZE / 2);

    return canvas.toDataURL('image/png');
};
