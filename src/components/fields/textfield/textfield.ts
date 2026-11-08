import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

export interface TextFieldConfig<V = string> extends FieldConfig<V> {
  inputType?: 'text' | 'email' | 'tel' | 'url' | 'search' | 'password';
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autocomplete?: string;
  selectOnFocus?: boolean;
  clearable?: boolean;
}

type Input = HTMLInputElement | HTMLTextAreaElement;

export class TextField<V = string, C extends TextFieldConfig<V> = TextFieldConfig<V>> extends Field<V, C> {
  protected override baseCls = 'op-field op-textfield';
  protected clearBtn?: HTMLButtonElement;

  /** Subclasses (TextArea, ...) replace the native control. */
  protected createInput(): Input {
    return h('input', 'op-textfield__input', { type: this.config.inputType ?? 'text' });
  }

  protected get input(): Input {
    return this.inputEl as Input;
  }

  protected createControl() {
    const c = this.config;
    const input = (this.inputEl = this.createInput());
    const wrap = h('div', 'op-textfield__wrap', {}, input);
    if (c.placeholder) input.placeholder = c.placeholder;
    if (c.maxLength != null) input.maxLength = c.maxLength;
    if (c.autocomplete) input.autocomplete = c.autocomplete as AutoFill;
    this.listen(input, 'input', () => this.onInput());
    this.listen(input, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    if (c.selectOnFocus) this.listen(input, 'focus', () => input.select());
    if (c.clearable) {
      this.clearBtn = h('button', 'op-textfield__clear', { type: 'button', tabindex: -1, 'aria-label': t('clear') }, iconEl('x'));
      this.listen(this.clearBtn, 'click', () => {
        this.setValue(this.parse(''));
        input.focus();
      });
      wrap.append(this.clearBtn);
    }
    return wrap;
  }

  /** The text the user typed becomes the value on every edit. */
  protected onInput(): void {
    this.el.classList.toggle('has-value', !!this.input.value);
    this.commit(this.parse(this.input.value));
  }

  /** Text → value. Subclasses with non-string values (NumberField) override. */
  protected parse(text: string): V {
    return text as V;
  }
  /** Value → text shown in the input. */
  protected display(v: V): string {
    return v == null ? '' : String(v);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.defaultPrevented) this.emit('enter', this.getValue());
    else if (e.key === 'Escape' && this.config.clearable && this.input.value) {
      e.stopPropagation();
      this.setValue(this.parse(''));
    }
  }

  override getDisplayText(): string {
    return this.rendered ? this.input.value : this.display(this.value);
  }

  protected applyValue(v: V): void {
    this.input.value = this.display(v);
    this.el.classList.toggle('has-value', !!this.input.value);
  }

  protected override onReadonly(readonly: boolean) {
    this.input.readOnly = readonly;
  }
  protected override onDisabled(disabled: boolean) {
    this.input.disabled = disabled;
    if (this.clearBtn) this.clearBtn.disabled = disabled;
  }

  protected override check(): string {
    const base = super.check();
    const v = this.display(this.value);
    const c = this.config;
    if (base || !v) return base;
    if (c.minLength != null && v.length < c.minLength) return t('minLength', { n: c.minLength });
    if (c.pattern && !new RegExp(c.pattern).test(v)) return t('pattern');
    return '';
  }

  setPlaceholder(text: string) {
    this.config.placeholder = text;
    if (this.rendered) this.input.placeholder = text;
  }
  setMaxLength(n: number) {
    this.config.maxLength = n;
    if (this.rendered) this.input.maxLength = n;
  }
  setInputType(type: NonNullable<TextFieldConfig['inputType']>) {
    this.config.inputType = type;
    if (this.rendered && this.input instanceof HTMLInputElement) this.input.type = type;
  }
  select() {
    this.input.select();
  }
  getInput(): Input {
    this.render();
    return this.input;
  }
}
register('textfield', TextField);
