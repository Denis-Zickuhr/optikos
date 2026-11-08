import { PickerField, type PickerConfig } from '../pickerfield/pickerfield';
import { register } from '../../../core/registry';

export interface SelectConfig<V = unknown> extends PickerConfig<V> {}

/** Pick one option from a closed list. The input is read-only; letters jump to matching labels. */
export class Select<V = unknown> extends PickerField<V, SelectConfig<V>> {
  protected override baseCls = 'op-field op-textfield op-picker op-select';
  protected override editable() {
    return false;
  }
  protected override emptyValue(): V {
    return null as V;
  }
  protected override isEmpty(v: V) {
    return v == null || (v as unknown) === '';
  }
}
register('select', Select);
