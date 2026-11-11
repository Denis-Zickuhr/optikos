import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { DateField } from '../datefield/datefield';
import { TimeField } from '../timefield/timefield';

addMessages('en', { dtDate: 'Date', dtTime: 'Time', datetime: 'Enter a date and a time' });
addMessages('pt-BR', { dtDate: 'Data', dtTime: 'Hora', datetime: 'Informe a data e a hora' });

export interface DateTimeFieldConfig extends FieldConfig<string | null> {
  /** Earliest and latest date, `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  /** Minutes moved by ↑/↓ in the time part. */
  step?: number;
  /** The value is the ISO instant (`2026-11-10T17:30:00.000Z`) of what the user typed, in their time zone. Default: the local `YYYY-MM-DDTHH:mm`. */
  utc?: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A date and a time of day side by side. The value is one ISO string (local, or UTC with `utc`) or null. */
export class DateTimeField extends Field<string | null, DateTimeFieldConfig> {
  protected override baseCls = 'op-field op-datetimefield';
  private date!: DateField;
  private time!: TimeField;

  protected override emptyValue() {
    return null;
  }
  protected override isEmpty(v: string | null) {
    return !v;
  }

  protected createControl() {
    const { min, max, step } = this.config;
    this.date = new DateField({ min, max, ariaLabel: t('dtDate') });
    this.time = new TimeField({ step, ariaLabel: t('dtTime') });
    for (const f of [this.date, this.time]) f.on('change', () => this.compose());
    this.own(() => (this.date.destroy(), this.time.destroy()));
    this.inputEl = this.date.el.querySelector('input')!;
    return h('div', 'op-datetimefield__parts', { role: 'group' }, this.date.el, this.time.el);
  }

  /** Both parts → the value. One part alone is not a value yet (`check` says so). */
  private compose() {
    const d = this.date.getValue();
    const tm = this.time.getValue();
    let v: string | null = null;
    if (d && tm) v = this.config.utc ? new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8), +tm.slice(0, 2), +tm.slice(3)).toISOString() : `${d}T${tm}`;
    this.commit(v);
  }

  protected applyValue(v: string | null) {
    let d: string | null = null;
    let tm: string | null = null;
    if (v) {
      const x = this.config.utc ? new Date(v) : undefined;
      [d, tm] = x ? [`${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`, `${pad(x.getHours())}:${pad(x.getMinutes())}`] : v.split('T').map((s) => s.slice(0, s.includes(':') ? 5 : 10));
    }
    this.date.setValue(d, true);
    this.time.setValue(tm, true);
  }

  override getDisplayText() {
    return this.value ? [this.date.getDisplayText(), this.time.getDisplayText()].join(' ') : '';
  }

  protected override check(): string {
    const [d, tm] = [this.date.getValue(), this.time.getValue()];
    if (!this.date.isValid() || !this.time.isValid() || (!!d !== !!tm)) return t('datetime');
    return super.check();
  }

  protected override onDisabled(disabled: boolean) {
    this.date.setDisabled(disabled);
    this.time.setDisabled(disabled);
  }
  protected override onReadonly(readonly: boolean) {
    this.date.setReadonly(readonly);
    this.time.setReadonly(readonly);
  }

  setMin(min: string | undefined) {
    this.config.min = min;
    this.date.setMin(min);
  }
  setMax(max: string | undefined) {
    this.config.max = max;
    this.date.setMax(max);
  }
}
register('datetimefield', DateTimeField);
