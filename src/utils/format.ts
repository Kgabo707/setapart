/** `2412` → `40:12`, `210` → `3:30`, `5280` → `1:28:00`. */
export const formatDuration = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
};

/** `1204881` → `1.2M views`. */
export const formatViewCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`;
  return String(count);
};

export const formatViews = (count: number): string =>
  `${formatViewCount(count)} ${count === 1 ? 'view' : 'views'}`;

const RELATIVE_UNITS: [string, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/**
 * Units where Intl.RelativeTimeFormat's `numeric: 'auto'` mode uses a word instead of
 * a number for magnitude 1 — e.g. "yesterday" rather than "1 day ago". Hour and minute
 * always stay numeric regardless of auto mode, so they're deliberately absent here.
 */
const AUTO_LABELS: Record<string, [past: string, future: string]> = {
  year: ['last year', 'next year'],
  month: ['last month', 'next month'],
  week: ['last week', 'next week'],
  day: ['yesterday', 'tomorrow'],
};

/**
 * Formats a date like "2 days ago" / "in 3 hours" / "yesterday", matching what
 * `Intl.RelativeTimeFormat('en', { numeric: 'auto' })` produces — but without
 * depending on it. That API isn't reliably present in React Native's JS engine
 * (Hermes) the way it is on web or Node, and calling `new Intl.RelativeTimeFormat`
 * where it's missing throws "undefined cannot be used as a constructor" — which
 * crashed every screen rendering a video's date on-device while working fine on web.
 */
export const formatRelativeDate = (isoDate: string, now: Date = new Date()): string => {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) return '';

  const deltaSeconds = Math.round((timestamp - now.getTime()) / 1000);
  const magnitude = Math.abs(deltaSeconds);

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (magnitude >= secondsInUnit) {
      const value = Math.round(deltaSeconds / secondsInUnit);
      const auto = AUTO_LABELS[unit];
      if (auto && Math.abs(value) === 1) {
        return value < 0 ? auto[0] : auto[1];
      }
      const plural = Math.abs(value) === 1 ? unit : `${unit}s`;
      return value < 0 ? `${Math.abs(value)} ${plural} ago` : `in ${value} ${plural}`;
    }
  }
  return 'just now';
};

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const isValidEmail = (email: string): boolean => /^\S+@\S+\.\S+$/.test(email.trim());
