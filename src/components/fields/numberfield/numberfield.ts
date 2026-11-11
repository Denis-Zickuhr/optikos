import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { register } from '../../../core/registry';
import { t, getLocale } from '../../../core/i18n';
import { clamp } from '../../../core/dom';

export interface NumberFieldConfig extends TextFieldConfig<number | null> {
  min?: number;
  max?: number;
  step?: number;
  /** Fixed decimals shown (and applied when the user leaves the field). */
  decimals?: number;
  /** `currency` and `percent` show through `Intl` (`R$ 1.234,56`, `$1,234.56`, `15%`). Default: plain number. */
  format?: 'decimal' | 'currency' | 'percent';
  /** ISO 4217 code for `format: 'currency'`. Default: the locale's (`setCurrency`). */
  currency?: string;
  /** BCP 47 tag for this field's separators. Default: the active locale. */
  locale?: string;
  /** The value is the shown number times `scale`: `scale: 100` with currency keeps cents as an integer (`123456` shows `1.234,56`). */
  scale?: number;
}

export class NumberField extends TextField<number | null, NumberFieldConfig> {
  protected override baseCls = 'op-field op-textfield op-numberfield';
  /** Text that is not a number: reported as an error instead of silently dropped. */
  private garbage = false;

  protected override emptyValue() {
    return null;
  }
  protected override isEmpty(v: number | null) {
    return v == null;
  }

  private get lang() {
    return this.config.locale ?? getLocale()._lang;
  }
  private get decimalSep() {
    return new Intl.NumberFormat(this.lang).formatToParts(1.5).find((p) => p.type === 'decimal')!.value;
  }

  protected override parse(text: string): number | null {
    this.garbage = false;
    const s = text.trim();
    if (!s) return null;
    const { format, scale = 1 } = this.config;
    const dec = this.decimalSep;
    // what is neither a digit, a sign nor the decimal mark (currency sign, group separator, %) is dropped
    const n = Number(s.replace(new RegExp(`[^\\d\\-${dec === '.' ? '.' : ','}]`, 'g'), '').replace(dec, '.')) * (format === 'percent' ? 0.01 : 1);
    if (Number.isNaN(n) || !/\d/.test(s)) {
      this.garbage = true;
      return null;
    }
    return Math.round(n * scale * 1e9) / 1e9;
  }

  protected override display(v: number | null): string {
    if (v == null) return '';
    const { format = 'decimal', decimals: d, scale = 1 } = this.config;
    const n = v / scale;
    if (format === 'decimal' && d == null) return String(n).replace('.', this.decimalSep);
    return new Intl.NumberFormat(this.lang, { style: format, currency: format === 'currency' ? (this.config.currency ?? getLocale()._currency) : undefined, ...(d != null && { minimumFractionDigits: d, maximumFractionDigits: d }), useGrouping: format !== 'decimal' }).format(n);
  }

  protected override createControl() {
    const wrap = super.createControl();
    const i = this.input;
    i.setAttribute('inputmode', 'decimal');
    i.setAttribute('role', 'spinbutton');
    this.syncAria();
    // on blur the text is normalized to the configured decimals
    this.listen(i, 'blur', () => {
      if (!this.garbage) this.input.value = this.display(this.value);
    });
    return wrap;
  }

  private syncAria() {
    const { min, max } = this.config;
    const i = this.inputEl;
    if (min != null) i.setAttribute('aria-valuemin', String(min)); else i.removeAttribute('aria-valuemin');
    if (max != null) i.setAttribute('aria-valuemax', String(max)); else i.removeAttribute('aria-valuemax');
    if (this.value != null) i.setAttribute('aria-valuenow', String(this.value)); else i.removeAttribute('aria-valuenow');
  }

  protected override onInput() {
    super.onInput();
    this.syncAria();
    if (this.garbage) this.setError(t('number'));
    else if (this.error) this.validate();
  }
  protected override applyValue(v: number | null) {
    super.applyValue(v);
    this.garbage = false;
    this.syncAria();
  }

  protected override check(): string {
    if (this.garbage) return t('number');
    const base = super.check();
    const v = this.value;
    const { min, max } = this.config;
    if (base || v == null) return base;
    if (min != null && max != null && (v < min || v > max)) return t('range', { min, max });
    if (min != null && v < min) return t('min', { n: min });
    if (max != null && v > max) return t('max', { n: max });
    return '';
  }

  protected override onKey(e: KeyboardEvent) {
    const big = e.key === 'PageUp' || e.key === 'PageDown';
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || big) {
      e.preventDefault();
      this.bump((e.key.endsWith('Up') ? 1 : -1) * (big ? 10 : 1));
    } else super.onKey(e);
  }

  private bump(times: number) {
    const { step = 1, min, max, decimals, scale = 1 } = this.config;
    let n = (this.value ?? 0) + step * scale * times;
    if (min != null || max != null) n = clamp(n, min ?? -Infinity, max ?? Infinity);
    n = Number(n.toFixed(decimals == null ? 10 : Math.max(0, decimals + Math.log10(scale))));
    this.setValue(n);
  }
  increment() {
    this.bump(1);
  }
  decrement() {
    this.bump(-1);
  }

  setMin(min: number | undefined) {
    this.config.min = min;
    if (this.rendered) this.syncAria();
  }
  setMax(max: number | undefined) {
    this.config.max = max;
    if (this.rendered) this.syncAria();
  }
  setStep(step: number) {
    this.config.step = step;
  }
  setDecimals(decimals: number | undefined) {
    this.config.decimals = decimals;
    if (this.rendered) this.input.value = this.display(this.value);
  }
}
register('numberfield', NumberField);
