import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';

export type RadioOption = string | { value: string | number; label: string; disabled?: boolean };

export interface RadioGroupConfig extends FieldConfig<string | number | null> {
  options?: RadioOption[];
  direction?: 'vertical' | 'horizontal';
}

export class RadioGroup extends Field<string | number | null, RadioGroupConfig> {
  protected override baseCls = 'op-field op-radiogroup';
  private group!: HTMLElement;
  private inputs: HTMLInputElement[] = [];

  protected override emptyValue() {
    return null;
  }

  protected createControl() {
    this.group = h('div', 'op-radiogroup__options', { role: 'radiogroup', 'aria-labelledby': `${this.id}-label` });
    this.listen(this.group, 'change', (e: Event) => {
      const i = this.inputs.indexOf(e.target as HTMLInputElement);
      if (i < 0) return;
      if (this.config.readonly) return this.applyValue(this.value);
      this.commit(this.opts()[i].value);
      this.paintChecked(); // `commit` leaves the native control alone, but the custom dot follows the `is-checked` class
    });
    this.buildOptions();
    this.inputEl = this.inputs[0] ?? this.group;
    return this.group;
  }

  private opts() {
    return (this.config.options ?? []).map((o) => (typeof o === 'object' ? o : { value: o, label: o, disabled: false }));
  }

  private buildOptions() {
    this.inputs = [];
    this.group.replaceChildren(
      ...this.opts().map((o) => {
        const input = h('input', 'op-radio__input', { type: 'radio', name: this.id, value: String(o.value), disabled: !!o.disabled });
        this.inputs.push(input);
        return h('label', 'op-radio', {}, input, h('span', 'op-radio__dot'), h('span', 'op-radio__text', {}, o.label));
      }),
    );
    this.group.classList.toggle('op-radiogroup__options--horizontal', this.config.direction === 'horizontal');
  }

  protected override onRender() {
    super.onRender();
    // the group is labelled by the field label
    (this.el.querySelector('.op-field__label') as HTMLElement).id = `${this.id}-label`;
  }

  protected applyValue(v: string | number | null) {
    const opts = this.opts();
    this.inputs.forEach((input, i) => (input.checked = v != null && opts[i].value === v));
    this.paintChecked();
  }

  /** The `is-checked` class (what the styled dot reads) mirrors the native `checked` of each option. */
  private paintChecked() {
    for (const input of this.inputs) input.closest('label')!.classList.toggle('is-checked', input.checked);
  }

  override getDisplayText(): string {
    const v = this.getValue();
    return this.opts().find((o) => o.value === v)?.label ?? '';
  }

  protected override onDisabled(disabled: boolean) {
    this.inputs.forEach((i, n) => (i.disabled = disabled || !!this.opts()[n].disabled));
  }

  setOptions(options: RadioOption[]) {
    this.config.options = options;
    if (!this.rendered) return;
    this.buildOptions();
    this.inputEl = this.inputs[0] ?? this.group;
    this.applyValue(this.value);
    this.onDisabled(!!this.config.disabled);
  }
}
register('radiogroup', RadioGroup);
