import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { parseDate, formatDate } from '../../../core/date';
import { iconEl } from '../../base/icon/icon';
import { Dropdown } from '../../overlays/dropdown/dropdown';
import { Calendar } from '../../dates/calendar/calendar';

export interface DateFieldConfig extends TextFieldConfig<string | null> {
  min?: string;
  max?: string;
  firstDay?: number;
}

/** Value is an ISO date string (`YYYY-MM-DD`) or null; the text shown and accepted follows the locale. */
export class DateField extends TextField<string | null, DateFieldConfig> {
  protected override baseCls = 'op-field op-textfield op-picker op-datefield';
  private cal!: Calendar;
  private dd!: Dropdown;
  private garbage = false;

  protected override emptyValue() {
    return null;
  }
  protected override isEmpty(v: string | null) {
    return !v;
  }

  protected override parse(text: string): string | null {
    const iso = parseDate(text);
    this.garbage = !!text.trim() && !iso;
    return iso;
  }
  protected override display(v: string | null) {
    return v ? formatDate(v, { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  }

  protected override createControl() {
    const wrap = super.createControl();
    const input = this.input;
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');
    const trigger = h('button', 'op-picker__trigger', { type: 'button', tabindex: -1, 'aria-label': t('calOpen') }, iconEl('calendar'));
    this.listen(trigger, 'mousedown', (e: Event) => e.preventDefault());
    this.listen(trigger, 'click', () => {
      if (!this.config.disabled && !this.config.readonly) this.toggle();
    });
    wrap.append(trigger);
    const c = this.config;
    this.cal = new Calendar({ value: c.value, min: c.min, max: c.max, firstDay: c.firstDay });
    this.dd = new Dropdown({ anchor: wrap, content: this.cal, role: 'presentation' });
    this.cal.on('select', (iso: string) => {
      this.dd.close();
      this.setValue(iso);
      input.focus();
    });
    this.dd.on('open', () => {
      input.setAttribute('aria-expanded', 'true');
      this.el.classList.add('is-open');
      this.cal.setValue(this.value);
      this.cal.focusDay();
      this.emit('expand');
    });
    this.dd.on('close', () => {
      input.setAttribute('aria-expanded', 'false');
      this.el.classList.remove('is-open');
      this.emit('collapse');
    });
    this.own(() => this.dd.destroy());
    this.on('blur', () =>
      this.later(() => {
        const a = document.activeElement;
        if (!this.el.contains(a) && !this.dd.el.contains(a)) this.dd.close();
      }, 0),
    );
    return wrap;
  }

  protected override onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' && !this.dd.isOpen()) {
      e.preventDefault();
      this.open();
    } else super.onKey(e);
  }

  protected override onInput() {
    super.onInput();
    if (this.garbage) this.setError(t('date'));
    else if (this.error) this.validate();
  }
  protected override applyValue(v: string | null) {
    super.applyValue(v);
    this.garbage = false;
  }
  protected override onDisabled(disabled: boolean) {
    super.onDisabled(disabled);
    (this.el.querySelector('.op-picker__trigger') as HTMLButtonElement).disabled = disabled;
  }

  protected override check(): string {
    if (this.garbage) return t('date');
    const base = super.check();
    const v = this.value;
    if (base || !v) return base;
    const { min, max } = this.config;
    if (min && v < min) return t('dateMin', { n: formatDate(min) });
    if (max && v > max) return t('dateMax', { n: formatDate(max) });
    return '';
  }

  open() {
    if (this.config.disabled || this.config.readonly || !this.rendered) return;
    this.dd.open();
  }
  close() {
    this.dd?.close();
  }
  toggle() {
    if (this.dd.isOpen()) this.close();
    else this.open();
  }
  expand() {
    this.open();
  }
  collapse() {
    this.close();
  }
  setMin(min: string | undefined) {
    this.config.min = min;
    this.cal?.setMin(min);
  }
  setMax(max: string | undefined) {
    this.config.max = max;
    this.cal?.setMax(max);
  }
}
register('datefield', DateField);
