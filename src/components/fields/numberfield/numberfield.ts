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

  private get decimalSep() {
    return getLocale()._lang.startsWith('pt') ? ',' : '.';
  }

  protected override parse(text: string): number | null {
    this.garbage = false;
    const s = text.trim();
    if (!s) return null;
    const n = Number(this.decimalSep === ',' ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''));
    if (Number.isNaN(n)) {
      this.garbage = true;
      return null;
    }
    return n;
  }

  protected override display(v: number | null): string {
    if (v == null) return '';
    const d = this.config.decimals;
    return (d == null ? String(v) : v.toFixed(d)).replace('.', this.decimalSep);
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
    const { step = 1, min, max, decimals } = this.config;
    let n = (this.value ?? 0) + step * times;
    if (min != null || max != null) n = clamp(n, min ?? -Infinity, max ?? Infinity);
    n = Number(n.toFixed(decimals ?? 10));
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
