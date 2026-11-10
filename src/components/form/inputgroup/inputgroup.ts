import { Container, type ContainerConfig } from '../../../core/container';
import { Field } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../../base/icon/icon';

/** Text joined to the input (`'R$'`, `'.com'`), or a button. */
export type InputAffix = string | { icon?: string; text?: string; ariaLabel?: string; handler?: (field: Field<any>) => void };

export interface InputGroupConfig extends ContainerConfig {
  prefix?: InputAffix;
  suffix?: InputAffix;
}

/** Joins text or buttons to a field's input box. The field keeps its label, help, error, name and value. */
export class InputGroup extends Container<InputGroupConfig> {
  protected override baseCls = 'op-inputgroup';
  private affixes: HTMLElement[] = [];

  /** The field inside. */
  getField(): Field<any> | undefined {
    return this.query((c) => c instanceof Field)[0] as Field<any> | undefined;
  }

  protected override onRender() {
    super.onRender();
    this.paint();
    // the field rewrites aria-describedby when its error changes (and says so right after): put the affix text back
    for (const ev of ['invalid', 'valid']) this.getField()?.on(ev, () => this.describe());
  }

  /** Text affixes describe the input, after the field's own help and error. */
  private describe() {
    const input = this.getField()?.el.querySelector('[aria-invalid]');
    if (!input) return;
    const own = (input.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id && !id.startsWith(`${this.id}-`));
    const ids = [...own, ...this.affixes.filter((a) => a.tagName === 'SPAN').map((a) => a.id)];
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  /** `[prefix][the field's input box][suffix]` inside the field's control. */
  private paint() {
    const field = this.getField();
    if (!field) return;
    this.affixes.forEach((a) => a.remove());
    this.affixes = [];
    const control = field.el.querySelector<HTMLElement>('.op-field__control')!;
    let row = control.querySelector<HTMLElement>(':scope > .op-inputgroup__row');
    if (!row) {
      row = h('div', 'op-inputgroup__row');
      row.append(...Array.from(control.childNodes));
      control.append(row);
    }
    const make = (a: InputAffix, side: 'prefix' | 'suffix') => {
      if (typeof a === 'string') return h('span', `op-inputgroup__affix op-inputgroup__affix--${side}`, { id: `${this.id}-${side}` }, a);
      const b = h('button', `op-inputgroup__affix op-inputgroup__btn op-inputgroup__affix--${side}`, { type: 'button', 'aria-label': a.ariaLabel ?? null }, a.icon ? iconEl(a.icon) : '', a.text ? h('span', '', {}, a.text) : '');
      this.listen(b, 'click', () => a.handler?.(field));
      return b;
    };
    const { prefix, suffix } = this.config;
    if (prefix != null) row.prepend(this.track(make(prefix, 'prefix')));
    if (suffix != null) row.append(this.track(make(suffix, 'suffix')));
    field.el.classList.toggle('has-prefix', prefix != null);
    field.el.classList.toggle('has-suffix', suffix != null);
    this.describe();
  }

  private track(a: HTMLElement) {
    this.affixes.push(a);
    return a;
  }

  setPrefix(prefix: InputAffix | undefined) {
    this.config.prefix = prefix;
    if (this.rendered) this.paint();
  }
  setSuffix(suffix: InputAffix | undefined) {
    this.config.suffix = suffix;
    if (this.rendered) this.paint();
  }
}
register('inputgroup', InputGroup);
