import { t } from './i18n';
import type { Field } from './field';

/** Returns an error message, or `true`/`undefined` when valid. Empty values are skipped (use `required`). */
export type Validator<V = any> = (value: V, field: Field<V>) => string | true | undefined | void;

const len = (v: unknown) => (typeof v === 'string' || Array.isArray(v) ? v.length : 0);

export const minLength = (n: number, msg?: string): Validator => (v) => (len(v) < n ? (msg ?? t('minLength', { n })) : true);
export const maxLength = (n: number, msg?: string): Validator => (v) => (len(v) > n ? (msg ?? t('maxLength', { n })) : true);
export const pattern = (re: RegExp, msg?: string): Validator => (v) => (re.test(String(v)) ? true : (msg ?? t('pattern')));
export const email = (msg?: string): Validator => (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? true : (msg ?? t('email')));
export const min = (n: number, msg?: string): Validator => (v) => (Number(v) < n ? (msg ?? t('min', { n })) : true);
export const max = (n: number, msg?: string): Validator => (v) => (Number(v) > n ? (msg ?? t('max', { n })) : true);
export const range = (a: number, b: number, msg?: string): Validator => (v) =>
  Number(v) < a || Number(v) > b ? (msg ?? t('range', { min: a, max: b })) : true;
