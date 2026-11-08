import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { h } from '../../../core/dom';
import { iconEl } from '../../base/icon/icon';
import { Dropdown } from '../../overlays/dropdown/dropdown';
import { ListBox, type ListItem } from '../listbox/listbox';
import type { Store } from '../../../data/store';

export type { ListItem };
export type Option = string | number | Record<string, any>;

export interface PickerConfig<V = unknown> extends TextFieldConfig<V> {
  options?: Option[];
  store?: Store<any>;
  valueField?: string;
  displayField?: string;
  /** Text that does not match an item is discarded on blur. Default true. */
  forceSelection?: boolean;
  emptyText?: string;
  openOnFocus?: boolean;
  maxHeight?: number | string;
  /** Show the record's value (its id) as a badge inside the field and as a hint in every list row. Default false. */
  showValue?: boolean;
}

/**
 * Shared base of Select, ComboBox and SuggestField: an input that owns a Dropdown with a ListBox,
 * the ARIA combobox wiring and the keyboard model. Subclasses decide what typing does (`onType`)
 * and whether the input is editable.
 */
export abstract class PickerField<V = unknown, C extends PickerConfig<V> = PickerConfig<V>> extends TextField<V, C> {
  protected override baseCls = 'op-field op-textfield op-picker';
  protected items: ListItem[] = [];
  protected selection?: ListItem;
  /** The user typed since the last selection/blur; the input text is a search term, not the value's label. */
  protected typed = false;
  protected list!: ListBox;
  protected dd!: Dropdown;
  private triggerEl?: HTMLButtonElement;
  private idEl?: HTMLElement;
  private wrapEl?: HTMLElement;
  private buffer = '';
  private bufferTimer?: ReturnType<typeof setTimeout>;

  protected editable(): boolean {
    return true;
  }
  protected hasTrigger(): boolean {
    return true;
  }
  /** Called when the user types in an editable picker. */
  protected onType(_text: string): void {}

  // ---- items ---------------------------------------------------------------------------------

  protected toItem(o: Option): ListItem {
    if (typeof o !== 'object') return { value: o, label: String(o) };
    const vf = this.config.valueField ?? 'value';
    const df = this.config.displayField ?? 'label';
    return { value: o[vf], label: String(o[df] ?? o[vf] ?? ''), disabled: !!o.disabled, raw: o, hint: this.config.showValue ? String(o[vf]) : undefined };
  }

  protected loadItems(): void {
    const c = this.config;
    this.items = c.store ? c.store.getData().map((r) => this.toItem(r)) : (c.options ?? []).map((o) => this.toItem(o));
  }

  setOptions(options: Option[]): void {
    this.config.options = options;
    this.loadItems();
    this.refreshList();
    if (this.rendered) this.applyValue(this.value);
  }

  setStore(store: Store<any>): void {
    this.config.store = store;
    this.bindStore();
    this.loadItems();
    this.refreshList();
  }

  private offStore?: () => void;
  private bindStore(): void {
    this.offStore?.();
    this.offStore = this.config.store?.subscribe(() => {
      this.loadItems();
      this.refreshList();
      if (this.rendered) this.applyValue(this.value);
    });
  }

  protected findItem(value: unknown): ListItem | undefined {
    return this.items.find((i) => i.value === value) ?? (this.selection?.value === value ? this.selection : undefined);
  }

  getSelection(): ListItem | undefined {
    return this.selection;
  }

  /** Selects an item object directly (needed when the list does not contain it, e.g. a remote value). */
  setSelection(item: ListItem | undefined, silent = false): void {
    this.selection = item;
    this.setValue((item ? item.value : this.emptyValue()) as V, silent);
  }

  /** The items to display for the current search state. Default: all. */
  protected visibleItems(): ListItem[] {
    return this.items;
  }

  protected refreshList(): void {
    if (!this.list) return;
    const shown = this.visibleItems();
    this.list.setItems(shown);
    this.list.setSelected(this.value);
    const sel = shown.findIndex((i) => i.value === this.value && !i.disabled);
    this.list.setActive(this.typed || sel < 0 ? shown.findIndex((i) => !i.disabled) : sel);
    this.syncActive();
  }

  private syncActive(): void {
    if (!this.rendered) return;
    const id = this.list.getActiveId();
    if (id && this.dd.isOpen()) this.input.setAttribute('aria-activedescendant', id);
    else this.input.removeAttribute('aria-activedescendant');
  }

  // ---- rendering -----------------------------------------------------------------------------

  protected override createControl() {
    const wrap = super.createControl();
    const input = this.input;
    this.wrapEl = wrap;
    if (this.config.showValue) {
      this.idEl = h('span', 'op-picker__id');
      this.idEl.hidden = true;
      wrap.prepend(this.idEl);
    }
    this.list = new ListBox({ emptyText: this.config.emptyText, maxHeight: this.config.maxHeight, highlight: '' });
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', this.editable() ? 'list' : 'none');
    input.setAttribute('aria-controls', this.list.id);
    input.autocomplete = 'off';
    if (this.hasTrigger()) {
      this.triggerEl = h('button', 'op-picker__trigger', { type: 'button', tabindex: -1, 'aria-hidden': 'true' }, iconEl('chevron-down'));
      this.listen(this.triggerEl, 'mousedown', (e: Event) => e.preventDefault());
      this.listen(this.triggerEl, 'click', () => {
        if (this.config.disabled || this.config.readonly) return;
        input.focus();
        this.toggle();
      });
      wrap.append(this.triggerEl);
    }
    this.dd = new Dropdown({ anchor: wrap, content: this.list, matchWidth: true, role: 'presentation' });
    this.dd.on('open', () => {
      input.setAttribute('aria-expanded', 'true');
      this.el.classList.add('is-open');
      this.list.refresh();
      this.syncActive();
      this.emit('expand');
    });
    this.dd.on('close', () => {
      input.setAttribute('aria-expanded', 'false');
      this.el.classList.remove('is-open');
      input.removeAttribute('aria-activedescendant');
      this.emit('collapse');
    });
    this.list.on('select', (item: ListItem) => this.pick(item));
    this.list.on('active-change', () => this.syncActive());
    this.own(() => {
      this.offStore?.();
      this.dd.destroy();
    });
    return wrap;
  }

  protected override onRender(): void {
    this.bindStore();
    this.loadItems();
    super.onRender();
    if (!this.editable()) {
      this.input.readOnly = true;
      this.listen(this.input, 'click', () => this.toggle());
    } else if (this.config.openOnFocus) {
      this.listen(this.input, 'focus', () => this.open());
    }
    this.on('blur', () => this.settle());
    this.refreshList();
  }

  protected override onReadonly(readonly: boolean): void {
    this.input.readOnly = readonly || !this.editable();
    if (readonly) this.dd?.close();
  }
  protected override onDisabled(disabled: boolean): void {
    super.onDisabled(disabled);
    if (this.triggerEl) this.triggerEl.disabled = disabled;
    if (disabled) this.dd?.close();
  }

  protected override applyValue(v: V): void {
    const it = this.findItem(v);
    if (it) this.selection = it;
    else if (this.selection && this.selection.value !== v) this.selection = undefined;
    this.typed = false;
    this.input.value = it ? it.label : this.display(v);
    this.el.classList.toggle('has-value', !!this.input.value);
    this.list?.setSelected(v);
    this.paintId();
  }

  /** The id badge (`showValue`): visible while a record is selected, and the input makes room for it. */
  protected paintId(): void {
    const el = this.idEl;
    if (!el) return;
    const sel = this.selection;
    el.hidden = !sel || this.typed || this.isEmpty(this.value);
    el.textContent = el.hidden ? '' : String(sel!.value);
    this.wrapEl!.style.setProperty('--op-picker-id-width', el.hidden ? '0px' : `${el.offsetWidth}px`);
    this.wrapEl!.classList.toggle('has-id', !el.hidden);
  }

  override getDisplayText(): string {
    return this.rendered ? this.input.value : (this.findItem(this.value)?.label ?? this.display(this.value));
  }

  // ---- behavior ------------------------------------------------------------------------------

  open(): void {
    if (this.config.disabled || this.config.readonly || !this.rendered) return;
    if (!this.typed) this.refreshList();
    this.dd.open();
  }
  close(): void {
    this.dd?.close();
  }
  toggle(): void {
    if (this.dd.isOpen()) this.close();
    else this.open();
  }
  expand(): void {
    this.open();
  }
  collapse(): void {
    this.close();
  }

  protected pick(item: ListItem): void {
    if (item.disabled) return;
    this.selection = item;
    this.typed = false;
    this.input.value = item.label;
    this.el.classList.add('has-value');
    this.commit(item.value as V);
    this.paintId();
    this.close();
    this.emit('select', item);
  }

  /** Called on blur: commits free text or reverts to the selected label. */
  protected settle(): void {
    this.close();
    if (!this.editable() || !this.typed) return;
    this.typed = false;
    const text = this.input.value;
    if (!text && this.config.forceSelection !== false) {
      this.selection = undefined;
      this.commit(this.emptyValue());
    } else if (this.config.forceSelection === false) {
      this.selection = undefined;
      this.commit(text as V);
    } else {
      this.input.value = this.selection?.label ?? '';
    }
    this.el.classList.toggle('has-value', !!this.input.value);
    this.paintId();
    this.refreshList();
  }

  protected override onInput(): void {
    this.el.classList.toggle('has-value', !!this.input.value);
    if (!this.editable()) return;
    this.typed = true;
    this.paintId();
    if (this.config.forceSelection === false) this.commit(this.input.value as V);
    this.onType(this.input.value);
  }

  protected override onKey(e: KeyboardEvent): void {
    const open = this.dd.isOpen();
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        if (!open) return this.open();
        this.list.moveActive(e.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      case 'Enter':
        if (open) {
          e.preventDefault();
          if (this.list.getActive()) this.list.activate();
          else this.close();
        } else super.onKey(e);
        return;
      case 'Home':
      case 'End':
        if (open && !this.editable()) {
          e.preventDefault();
          this.list.setActive(e.key === 'Home' ? this.items.findIndex((i) => !i.disabled) : this.items.length - 1 - [...this.items].reverse().findIndex((i) => !i.disabled));
        }
        return;
      case 'Tab':
        if (open && this.typed && this.config.forceSelection !== false && this.list.getActive()) this.list.activate();
        return;
      case ' ':
        if (!this.editable()) {
          e.preventDefault();
          if (open && this.list.getActive()) this.list.activate();
          else this.open();
        }
        return;
      default:
        if (!this.editable() && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) this.typeahead(e.key);
        else super.onKey(e);
    }
  }

  /** Select-style type-ahead: letters jump to the next label that starts with them. */
  private typeahead(ch: string): void {
    clearTimeout(this.bufferTimer);
    this.buffer += ch.toLowerCase();
    this.bufferTimer = setTimeout(() => (this.buffer = ''), 600);
    this.own(() => clearTimeout(this.bufferTimer));
    const list = this.visibleItems();
    const from = this.dd.isOpen() ? this.list.getActiveIndex() : list.findIndex((i) => i.value === this.value);
    const order = [...list.keys()].map((_, k) => (from + (this.buffer.length > 1 ? 0 : 1) + k) % list.length);
    const hit = order.find((i) => !list[i].disabled && list[i].label.toLowerCase().startsWith(this.buffer));
    if (hit == null) return;
    if (this.dd.isOpen()) this.list.setActive(hit);
    else this.pick(list[hit]);
  }

  setEmptyText(text: string): void {
    this.config.emptyText = text;
    this.list?.setEmptyText(text);
  }
}
