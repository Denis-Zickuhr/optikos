import { getLocale } from './i18n';

/** Dates are handled as ISO strings (`YYYY-MM-DD`) and as local-midnight `Date`s; never UTC, so there is no time zone drift. */
const pad = (n: number, w = 2) => String(n).padStart(w, '0');
export const toISO = (d: Date): string => `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
}

export const today = (): string => toISO(new Date());

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso)!;
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Moves by whole months, clamping the day (Jan 31 + 1 month → Feb 28). */
export function addMonths(iso: string, n: number): string {
  const d = fromISO(iso)!;
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return toISO(d);
}

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'short' }): string => {
  const d = fromISO(iso);
  return d ? new Intl.DateTimeFormat(getLocale()._lang, opts).format(d) : '';
};

/**
 * Parses what a user types: ISO, or day/month/year in the order the current locale uses (derived from `Intl`),
 * with `/`, `-` or `.` as separators and 2- or 4-digit years.
 */
export function parseDate(text: string): string | null {
  text = text.trim();
  if (!text) return null;
  const iso = fromISO(text);
  if (iso) return toISO(iso);
  const parts = text.split(/[/.\-\s]+/).map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
  const order = new Intl.DateTimeFormat(getLocale()._lang).formatToParts(new Date(2000, 10, 25)).filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year').map((p) => p.type);
  const v: Record<string, number> = {};
  order.forEach((k, i) => (v[k] = parts[i]));
  if (v.year < 100) v.year += 2000;
  const d = new Date(v.year, v.month - 1, v.day);
  return d.getFullYear() === v.year && d.getMonth() === v.month - 1 && d.getDate() === v.day ? toISO(d) : null;
}

/** 0 = Sunday. Reads the locale's week start when the engine knows it. */
export function firstDay(): number {
  const l = getLocale();
  if (l._firstDay && l._firstDay !== '0') return Number(l._firstDay);
  try {
    const info = (new Intl.Locale(l._lang) as any).getWeekInfo?.() ?? (new Intl.Locale(l._lang) as any).weekInfo;
    if (info?.firstDay) return info.firstDay % 7;
  } catch { /* fall through */ }
  return 0;
}
