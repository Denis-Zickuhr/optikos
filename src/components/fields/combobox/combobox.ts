import { PickerField, type PickerConfig, type ListItem } from '../pickerfield/pickerfield';
import { register } from '../../../core/registry';

export interface ComboBoxConfig<V = unknown> extends PickerConfig<V> {
  filter?: 'contains' | 'startsWith' | ((item: ListItem, text: string) => boolean);
}

/** Editable list: typing filters the options locally. */
export class ComboBox<V = unknown> extends PickerField<V, ComboBoxConfig<V>> {
  protected override baseCls = 'op-field op-textfield op-picker op-combobox';
  private term = '';

  protected override emptyValue(): V {
    return null as V;
  }
  protected override isEmpty(v: V) {
    return v == null || (v as unknown) === '';
  }

  protected override visibleItems(): ListItem[] {
    const text = this.typed ? this.term.trim().toLowerCase() : '';
    if (!text) return this.items;
    const f = this.config.filter ?? 'contains';
    const test = typeof f === 'function' ? f : f === 'startsWith' ? (i: ListItem, s: string) => i.label.toLowerCase().startsWith(s) : (i: ListItem, s: string) => i.label.toLowerCase().includes(s);
    return this.items.filter((i) => test(i, text));
  }

  protected override onType(text: string) {
    this.term = text;
    this.refreshList();
    this.list.setHighlight(text);
    this.open();
  }

  protected override pick(item: ListItem) {
    this.term = '';
    super.pick(item);
    this.list.setHighlight('');
  }

  protected override settle() {
    super.settle();
    this.term = '';
    this.list.setHighlight('');
  }
}
register('combobox', ComboBox);
