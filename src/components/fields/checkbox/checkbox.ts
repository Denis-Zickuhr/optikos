import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../../base/icon/icon';

export interface CheckboxConfig extends FieldConfig<boolean> {
  boxLabel?: string;
  indeterminate?: boolean;
}

export class Checkbox extends Field<boolean, CheckboxConfig> {
  protected override baseCls = 'op-field op-checkbox';
  private textEl!: HTMLElement;

  protected override emptyValue() {
    return false;
  }
  /** `required` means "must be checked". */
  protected override isEmpty(v: boolean) {
    return !v;
  }

  protected createControl() {
    const input = (this.inputEl = h('input', 'op-checkbox__input', { type: 'checkbox' }));
    this.textEl = h('span', 'op-checkbox__text');
    const box = h('span', 'op-checkbox__box', {}, iconEl('check'), h('span', 'op-checkbox__dash'));
    const label = h('label', 'op-checkbox__label', {}, input, box, this.textEl);
    this.listen(input, 'change', () => {
      if (this.config.readonly) return void (input.checked = this.value);
      this.config.indeterminate = false;
      this.paint();
      this.commit(input.checked);
    });
    return label;
  }

  protected override onRender() {
    super.onRender();
    this.setBoxLabel(this.config.boxLabel ?? '');
    this.setIndeterminate(!!this.config.indeterminate);
  }

  protected applyValue(v: boolean) {
    (this.inputEl as HTMLInputElement).checked = !!v;
    this.paint();
  }

  private paint() {
    const input = this.inputEl as HTMLInputElement;
    const mixed = !!this.config.indeterminate;
    input.indeterminate = mixed;
    input.setAttribute('aria-checked', mixed ? 'mixed' : String(input.checked));
    this.el.classList.toggle('is-checked', input.checked && !mixed);
    this.el.classList.toggle('is-indeterminate', mixed);
  }

  protected override onDisabled(disabled: boolean) {
    (this.inputEl as HTMLInputElement).disabled = disabled;
  }

  setBoxLabel(text: string) {
    this.config.boxLabel = text;
    if (!this.rendered) return;
    this.textEl.textContent = text;
    this.textEl.hidden = !text;
  }
  setIndeterminate(on: boolean) {
    this.config.indeterminate = on;
    if (this.rendered) this.paint();
  }
  toggle() {
    this.setIndeterminate(false);
    this.setValue(!this.value);
  }
}
register('checkbox', Checkbox);
