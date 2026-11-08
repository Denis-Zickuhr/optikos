import { getLocale } from '../core/i18n';

export type Formatter = (value: any, options?: Record<string, any>) => string;

const lang = () => getLocale()._lang;
const date = (v: any, opts: Intl.DateTimeFormatOptions) => {
  if (v == null || v === '') return '';
  // ISO dates without time are local dates, not UTC.
  const d = v instanceof Date ? v : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(+v.slice(0, 4), +v.slice(5, 7) - 1, +v.slice(8, 10)) : new Date(v);
  return isNaN(+d) ? String(v) : new Intl.DateTimeFormat(lang(), opts).format(d);
};

const formats: Record<string, Formatter> = {
  number: (v, o) => (v == null || v === '' ? '' : new Intl.NumberFormat(lang(), o).format(v)),
  money: (v, o) => (v == null || v === '' ? '' : new Intl.NumberFormat(lang(), { style: 'currency', currency: getLocale()._currency, ...o }).format(v)),
  percent: (v, o) => (v == null || v === '' ? '' : new Intl.NumberFormat(lang(), { style: 'percent', maximumFractionDigits: 1, ...o }).format(v)),
  date: (v, o) => date(v, { dateStyle: 'medium', ...o }),
  datetime: (v, o) => date(v, { dateStyle: 'medium', timeStyle: 'short', ...o }),
  bool: (v) => (v ? '✓' : ''),
};

/** Registers a named formatter, usable as `format: 'name'` in columns. */
export function registerFormat(name: string, fn: Formatter): void {
  formats[name] = fn;
}

export function format(fmt: string | Formatter, value: unknown): string {
  const fn = typeof fmt === 'function' ? fmt : formats[fmt];
  if (!fn) throw new Error(`Optikos: unknown format "${fmt}"`);
  return fn(value);
}
