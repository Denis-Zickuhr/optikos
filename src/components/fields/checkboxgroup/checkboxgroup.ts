import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../../base/icon/icon';
import type { RadioOption } from '../radiogroup/radiogroup';

type Value = string | number;
export interface CheckboxGroupConfig extends FieldConfig<Value[]> {
  options?: RadioOption[];
  direction?: 'vertical' | 'horizontal';
}

/** Several choices from a few visible options; the value is the list of checked option values, in option order. */
export class CheckboxGroup extends Field<Value[], CheckboxGroupConfig> {
  protected override baseCls = 'op-field op-checkboxgroup';
  private group!: HTMLElement;
  private inputs: HTMLInputElement[] = [];

  protected override emptyValue(): Value[] {
    return [];
  }
  /** `required` means "at least one". */
  protected override isEmpty(v: Value[]) {
    return !v?.length;
  }
  protected override isEqual(a: Value[], b: Value[]) {
    return (a ?? []).length === (b ?? []).length && (a ?? []).every((x, i) => x === b[i]);
  }

  protected createControl() {
    this.group = h('div', 'op-checkboxgroup__options', { role: 'group', 'aria-labelledby': `${this.id}-label` });
    this.listen(this.group, 'change', (e: Event) => {
      if (!this.inputs.includes(e.target as HTMLInputElement)) return;
      if (this.config.readonly) return this.applyValue(this.value);
      const opts = this.opts();
      this.commit(this.inputs.flatMap((input, i) => (input.checked ? [opts[i].value] : [])));
      this.paint();
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
        const input = h('input', 'op-checkbox__input', { type: 'checkbox', value: String(o.value), disabled: !!o.disabled });
        this.inputs.push(input);
        // each option reuses the Checkbox look (`op-checkbox` + `is-checked` on the label)
        return h('label', 'op-checkbox op-checkbox__label', {}, input, h('span', 'op-checkbox__box', {}, iconEl('check')), h('span', 'op-checkbox__text', {}, o.label));
      }),
    );
    this.group.classList.toggle('op-checkboxgroup__options--horizontal', this.config.direction === 'horizontal');
  }

  protected override onRender() {
    super.onRender();
    (this.el.querySelector('.op-field__label') as HTMLElement).id = `${this.id}-label`;
  }

  protected applyValue(v: Value[]) {
    const opts = this.opts();
    this.inputs.forEach((input, i) => (input.checked = (v ?? []).includes(opts[i].value)));
    this.paint();
  }

  private paint() {
    for (const input of this.inputs) input.closest('label')!.classList.toggle('is-checked', input.checked);
  }

  override getDisplayText(): string {
    const v = this.getValue() ?? [];
    return this.opts().filter((o) => v.includes(o.value)).map((o) => o.label).join(', ');
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
register('checkboxgroup', CheckboxGroup);
