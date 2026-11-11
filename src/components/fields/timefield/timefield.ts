import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { register } from '../../../core/registry';
import { t, addMessages } from '../../../core/i18n';

addMessages('en', { time: 'Enter a time like 09:30' });
addMessages('pt-BR', { time: 'Informe uma hora, como 09:30' });

export interface TimeFieldConfig extends TextFieldConfig<string | null> {
  /** Earliest and latest time, `'HH:mm'`. */
  min?: string;
  max?: string;
  /** Minutes moved by ↑/↓ (PageUp/PageDown move an hour). Default 1. */
  step?: number;
}

const DAY = 1440;
const pad = (n: number) => String(n).padStart(2, '0');
const toMin = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
const fromMin = (n: number) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;

/** A time of day. The value is `'HH:mm'` (24 h) or `null`. Type `930`, `9:30` or `09:30`; ↑/↓ step it. */
export class TimeField extends TextField<string | null, TimeFieldConfig> {
  protected override baseCls = 'op-field op-textfield op-timefield';
  private garbage = false;

  protected override emptyValue() {
    return null;
  }
  protected override isEmpty(v: string | null) {
    return v == null;
  }

  protected override parse(text: string): string | null {
    this.garbage = false;
    const s = text.trim();
    if (!s) return null;
    const m = /^(\d{1,2})(?::?(\d{2}))?$/.exec(s) ?? /^(\d)(\d{2})$/.exec(s);
    const h = m && Number(m[1]);
    const min = m && Number(m[2] ?? 0);
    if (!m || h! > 23 || min! > 59) return ((this.garbage = true), null);
    return `${pad(h!)}:${pad(min!)}`;
  }

  protected override createControl() {
    const wrap = super.createControl();
    this.input.setAttribute('inputmode', 'numeric');
    this.listen(this.input, 'blur', () => {
      if (!this.garbage) this.input.value = this.display(this.value);
    });
    return wrap;
  }

  protected override onInput() {
    super.onInput();
    if (this.garbage) this.setError(t('time'));
    else if (this.error) this.validate();
  }
  protected override applyValue(v: string | null) {
    super.applyValue(v);
    this.garbage = false;
  }

  protected override check(): string {
    if (this.garbage) return t('time');
    const base = super.check();
    const v = this.value;
    const { min, max } = this.config;
    if (base || v == null) return base;
    if (min && max && (v < min || v > max)) return t('range', { min, max });
    if (min && v < min) return t('min', { n: min });
    if (max && v > max) return t('max', { n: max });
    return '';
  }

  protected override onKey(e: KeyboardEvent) {
    const big = e.key === 'PageUp' || e.key === 'PageDown';
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || big) {
      e.preventDefault();
      this.bump((e.key.endsWith('Up') ? 1 : -1) * (big ? 60 : this.config.step ?? 1));
    } else super.onKey(e);
  }

  private bump(minutes: number) {
    const { min, max } = this.config;
    const n = (this.value ? toMin(this.value) : min ? toMin(min) : 0) + minutes;
    const lo = min ? toMin(min) : 0;
    const hi = max ? toMin(max) : DAY - 1;
    // with no limits the clock wraps around midnight
    this.setValue(fromMin(min || max ? Math.min(hi, Math.max(lo, n)) : (n + DAY) % DAY));
  }

  setMin(min: string | undefined) {
    this.config.min = min;
  }
  setMax(max: string | undefined) {
    this.config.max = max;
  }
}
register('timefield', TimeField);
