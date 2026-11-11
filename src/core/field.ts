import { Component, type ComponentConfig } from './component';
import { h, uid } from './dom';
import { t } from './i18n';
import type { Validator } from './validators';
import { getPath } from './path';

export interface FieldConfig<V = unknown> extends ComponentConfig {
  name?: string;
  label?: string;
  labelPos?: 'top' | 'left';
  value?: V;
  required?: boolean;
  readonly?: boolean;
  help?: string;
  validators?: Validator<V>[];
  /** When to validate on its own. After the first error it revalidates on every change. Default `blur`. */
  validateOn?: 'blur' | 'change' | 'submit';
  /** Lookups and pickers: the key of the loaded record that holds the text to show for the value (`evento` + `displayFrom: 'eventoNome'`). */
  displayFrom?: string;
  /** ms of quiet after the last change before `settled` fires (0 = right away). `change` itself is never delayed. */
  debounce?: number;
}

/**
 * Base of every field: value, validation, dirty tracking, label and messages.
 * Subclasses implement `createControl` (build the control, assign `inputEl`), `applyValue` (value → DOM)
 * and call `commit` when the user edits (DOM → value).
 */
export abstract class Field<V = unknown, C extends FieldConfig<V> = FieldConfig<V>> extends Component<C> {
  protected override baseCls = 'op-field';
  protected value: V;
  protected original: V;
  protected error = '';
  /** The focusable control; `label for`, `aria-invalid` and `aria-describedby` point at it. */
  protected inputEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private helpEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private dirty = false;
  private cancelSettle?: () => void;

  constructor(config: C = {} as C) {
    super(config);
    this.value = this.original = config.value ?? this.emptyValue();
  }

  get name(): string | undefined {
    return this.config.name;
  }

  protected abstract createControl(): HTMLElement;
  protected abstract applyValue(value: V): void;
  protected emptyValue(): V {
    return '' as V;
  }
  protected isEmpty(v: V): boolean {
    return v == null || (v as unknown) === '' || (Array.isArray(v) && !v.length);
  }
  protected isEqual(a: V, b: V): boolean {
    return a === b || JSON.stringify(a) === JSON.stringify(b);
  }

  protected override build(): HTMLElement {
    const c = this.config;
    const el = h('div', `${this.baseCls}${c.labelPos === 'left' ? ' op-field--label-left' : ''}`);
    this.labelEl = h('label', 'op-field__label');
    const control = h('div', 'op-field__control', {}, this.createControl());
    this.helpEl = h('div', 'op-field__help', { id: `${this.id}-help` });
    this.errorEl = h('div', 'op-field__error', { id: `${this.id}-error`, role: 'alert' });
    el.append(this.labelEl, control, this.helpEl, this.errorEl);
    return el;
  }

  protected override onRender(): void {
    const c = this.config;
    const input = this.inputEl;
    input.id ||= uid('op-input');
    (this.labelEl as HTMLLabelElement).htmlFor = input.id;
    // a field without a visible label is named by `ariaLabel` on its control (the root is just a wrapper)
    if (c.ariaLabel && input !== this.el) {
      input.setAttribute('aria-label', c.ariaLabel);
      this.el.removeAttribute('aria-label');
    }
    this.setLabel(c.label ?? '');
    this.setHelp(c.help ?? '');
    this.setRequired(!!c.required);
    this.setReadonly(!!c.readonly);
    this.applyValue(this.value);
    this.paintError();
    this.listen(this.el, 'focusin', () => {
      this.el.classList.add('is-focused');
      this.emit('focus');
    });
    this.listen(this.el, 'focusout', (e: FocusEvent) => {
      if (this.el.contains(e.relatedTarget as Node)) return;
      this.flushSettled();
      this.el.classList.remove('is-focused');
      if ((c.validateOn ?? 'blur') === 'blur') this.validate();
      this.emit('blur');
    });
  }

  protected override focusEl(): HTMLElement {
    this.render();
    return this.inputEl;
  }

  // ---- value ---------------------------------------------------------------------------------

  getValue(): V {
    return this.value;
  }

  /** Sets the value programmatically. `silent` skips the `change` event and validation. */
  setValue(v: V, silent = false): void {
    const old = this.value;
    this.value = v;
    if (this.rendered) this.applyValue(v);
    if (!this.isEqual(old, v)) this.changed(old, silent);
  }

  /** Silently takes this field's value from a record (by `name`); does nothing when the record lacks the key. */
  fillFrom(record: Record<string, any>): void {
    const v = this.name ? getPath(record, this.name) : undefined;
    if (v !== undefined) this.setValue(v, true);
  }

  /** For subclasses: the user edited the control and the DOM already shows `v`. */
  protected commit(v: V): void {
    const old = this.value;
    this.value = v;
    if (!this.isEqual(old, v)) this.changed(old, false);
  }

  private changed(old: V, silent: boolean): void {
    this.updateDirty();
    if (silent) return;
    if (this.config.validateOn === 'change' || this.error) this.validate();
    this.emit('change', this.value, old);
    this.queueSettled();
  }

  /** `settled(value)`: the value after the user stopped changing it for `debounce` ms (immediately without `debounce`). */
  private queueSettled(): void {
    this.cancelSettle?.();
    this.cancelSettle = undefined;
    const ms = this.config.debounce;
    if (!ms) return void this.emit('settled', this.value);
    this.cancelSettle = this.later(() => {
      this.cancelSettle = undefined;
      this.emit('settled', this.value);
    }, ms);
  }

  /** Fires a pending `settled` now (Enter, blur, end of a drag...). No-op when nothing is waiting. */
  protected flushSettled(): void {
    if (!this.cancelSettle) return;
    this.cancelSettle();
    this.cancelSettle = undefined;
    this.emit('settled', this.value);
  }

  private updateDirty(): void {
    const d = this.isDirty();
    if (d === this.dirty) return;
    this.dirty = d;
    if (this.rendered) this.el.classList.toggle('is-dirty', d);
    this.emit('dirty-change', d);
  }

  /** What the user sees as this field's value (a select's label, a formatted date); used by summaries such as the StepForm review. */
  getDisplayText(): string {
    const v = this.value;
    return this.isEmpty(v) ? '' : String(v);
  }

  /** Sets the empty value (`''`, `null`, `false`...) and emits `change`. */
  clear(): void {
    this.setValue(this.emptyValue());
  }

  isDirty(): boolean {
    return !this.isEqual(this.value, this.original);
  }

  /** The current value becomes the "original" (as after loading or saving). */
  markClean(): void {
    this.original = this.value;
    this.updateDirty();
  }

  reset(): void {
    this.setValue(this.original, true);
    this.clearError();
  }

  // ---- validation ----------------------------------------------------------------------------

  /** Returns the error message for the current value, or `''`. No UI side effects. */
  protected check(): string {
    const v = this.value;
    if (this.isEmpty(v)) return this.config.required ? t('required') : '';
    for (const fn of this.config.validators ?? []) {
      const r = fn(v, this as Field<any>);
      if (typeof r === 'string') return r;
    }
    return '';
  }

  validate(): boolean {
    const msg = this.check();
    if (msg) this.setError(msg);
    else this.clearError();
    return !msg;
  }

  isValid(): boolean {
    return !this.check();
  }

  getError(): string {
    return this.error;
  }

  setError(msg: string): void {
    const was = this.error;
    this.error = msg;
    this.paintError();
    if (msg && msg !== was) this.emit('invalid', msg);
  }

  clearError(): void {
    if (!this.error) return;
    this.error = '';
    this.paintError();
    this.emit('valid');
  }

  private paintError(): void {
    if (!this.rendered) return;
    this.errorEl.textContent = this.error;
    this.el.classList.toggle('is-invalid', !!this.error);
    this.inputEl.setAttribute('aria-invalid', String(!!this.error));
    this.describe();
  }

  private describe(): void {
    const ids = [this.error && this.errorEl.id, this.config.help && this.helpEl.id].filter(Boolean);
    if (ids.length) this.inputEl.setAttribute('aria-describedby', ids.join(' '));
    else this.inputEl.removeAttribute('aria-describedby');
  }

  // ---- setters -------------------------------------------------------------------------------

  setLabel(label: string): void {
    this.config.label = label;
    if (!this.rendered) return;
    this.labelEl.textContent = label;
    this.labelEl.hidden = !label;
  }

  setHelp(help: string): void {
    this.config.help = help;
    if (!this.rendered) return;
    this.helpEl.textContent = help;
    this.helpEl.hidden = !help;
    this.describe();
  }

  setRequired(required: boolean): void {
    this.config.required = required;
    if (!this.rendered) return;
    this.el.classList.toggle('is-required', required);
    this.inputEl.setAttribute('aria-required', String(required));
  }

  setReadonly(readonly: boolean): void {
    this.config.readonly = readonly;
    if (!this.rendered) return;
    this.el.classList.toggle('is-readonly', readonly);
    this.onReadonly(readonly);
  }

  setValidators(validators: Validator<V>[]): void {
    this.config.validators = validators;
  }

  protected onReadonly(_readonly: boolean): void {}
}
