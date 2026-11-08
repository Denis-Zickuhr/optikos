import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';
import { MessageBox } from '../../overlays/messagebox/messagebox';

export interface SecretFieldConfig extends TextFieldConfig<string | null> {
  /** A secret is already saved. It can never be shown; it can only be replaced. `form.load({ key: true })` sets it too. */
  stored?: boolean;
  /** Ask before replacing a saved secret. Default true. */
  confirmReplace?: boolean;
  replaceTitle?: string;
  replaceText?: string;
  /** The eye hides the value again when the field loses focus. Default true. */
  autoHide?: boolean;
}

const MASK = '••••••••';

/**
 * A field for secrets. While you type you can peek at what you typed (the eye); once a secret is saved it is shown only as a
 * mask and can never be read back: to change it you replace it, after a warning. `getValue()` is `null` while untouched
 * (keep what is saved), the new text once typed, `''` when replaced and left empty.
 */
export class SecretField extends TextField<string | null, SecretFieldConfig> {
  protected override baseCls = 'op-field op-textfield op-secret';
  private stored = false;
  private initialStored = false;
  private replacing = false;
  private revealed = false;
  private eyeBtn!: HTMLButtonElement;
  private replaceBtn!: HTMLButtonElement;
  private keepBtn!: HTMLButtonElement;
  private hint!: HTMLElement;

  constructor(config: SecretFieldConfig = {}) {
    super({ autocomplete: 'new-password', ...config, inputType: 'password' });
    this.stored = this.initialStored = !!config.stored;
  }

  protected override emptyValue(): string | null {
    return null;
  }
  /** A saved secret that was not touched counts as filled in (so `required` is satisfied). */
  protected override isEmpty(v: string | null) {
    return !this.stored && (v == null || v === '');
  }

  protected override createControl() {
    const wrap = super.createControl();
    const input = this.input;
    input.spellcheck = false;
    this.eyeBtn = h('button', 'op-secret__eye', { type: 'button', 'aria-pressed': 'false' });
    this.replaceBtn = h('button', 'op-secret__replace', { type: 'button' }, t('secretReplace'));
    this.keepBtn = h('button', 'op-secret__keep', { type: 'button' }, t('secretKeep'));
    this.hint = h('div', 'op-secret__hint', { id: `${this.id}-hint` }, h('span', 'op-secret__note', {}, t('secretStored')), this.keepBtn);
    this.listen(this.eyeBtn, 'mousedown', (e: Event) => e.preventDefault()); // keep the focus in the input (it would hide the value)
    this.listen(this.eyeBtn, 'click', () => this.setRevealed(!this.revealed));
    this.listen(this.replaceBtn, 'click', () => void this.replace());
    this.listen(this.keepBtn, 'click', () => this.keep());
    // a saved secret is opened for replacement by clicking or pressing a key in the (read-only) field
    this.listen(input, 'click', () => this.stored && void this.replace());
    this.listen(input, 'keydown', (e: KeyboardEvent) => {
      if (this.stored && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        void this.replace();
      }
    });
    this.on('blur', () => this.config.autoHide !== false && this.setRevealed(false));
    wrap.append(this.eyeBtn, this.replaceBtn);
    return h('div', 'op-secret__box', {}, wrap, this.hint);
  }

  protected override onRender() {
    super.onRender();
    this.paint();
  }

  // ---- state ---------------------------------------------------------------------------------

  isStored(): boolean {
    return this.stored;
  }
  /** The user chose to replace a saved secret and has not finished. */
  isReplacing(): boolean {
    return this.replacing;
  }
  isRevealed(): boolean {
    return this.revealed;
  }

  /** Says whether a secret is saved (a saved secret is never given to the field, only the fact that it exists). */
  setStored(stored: boolean): void {
    this.stored = stored;
    this.replacing = false;
    this.revealed = false;
    super.setValue(null, true);
    this.paint();
    this.emit('stored-change', stored);
  }

  /** `true` (what `form.load` passes for "a secret exists") means saved; a string is a new value typed or set by code. */
  override setValue(v: string | boolean | null, silent = false): void {
    if (v === true) return this.setStored(true);
    if (v === false) v = null;
    if (this.stored && v != null) {
      this.stored = false;
      this.replacing = true;
    }
    super.setValue(v, silent);
    this.paint();
  }

  override markClean(): void {
    super.markClean();
    this.initialStored = this.stored;
  }
  /** Back to what was loaded: the saved secret, untouched. */
  override reset(): void {
    this.setStored(this.initialStored);
    super.reset();
  }

  /** Warns, then turns a saved secret into an empty field to type the new value in. Resolves to whether it was replaced. */
  async replace(): Promise<boolean> {
    if (!this.stored || this.config.readonly || this.config.disabled || this.emit('before-replace') === false) return false;
    if (this.config.confirmReplace !== false) {
      const ok = await MessageBox.confirm(this.config.replaceText ?? t('secretWarn'), { danger: true, title: this.config.replaceTitle ?? t('secretWarnTitle'), okText: t('secretReplace') });
      if (!ok) return false;
    }
    this.stored = false;
    this.replacing = true;
    super.setValue('', false);
    this.paint();
    this.input.focus();
    this.emit('replace');
    return true;
  }

  /** Gives up replacing: the saved secret stays as it was. */
  keep(): void {
    if (!this.replacing) return;
    this.stored = true;
    this.replacing = false;
    this.revealed = false;
    super.setValue(null, false);
    this.paint();
    this.emit('keep');
  }

  setRevealed(on: boolean): void {
    if (this.stored) on = false; // there is nothing to see
    this.revealed = on;
    this.paint();
  }

  /** Never reveals: a mask when there is something, nothing otherwise. */
  override getDisplayText(): string {
    return this.stored || (this.value ?? '') !== '' ? MASK : '';
  }

  // ---- view ----------------------------------------------------------------------------------

  private paint(): void {
    if (!this.rendered) return;
    const input = this.input as HTMLInputElement;
    const on = this.revealed && !this.stored;
    input.type = on ? 'text' : 'password';
    input.readOnly = this.stored || !!this.config.readonly;
    input.placeholder = this.stored ? MASK : (this.config.placeholder ?? '');
    if (this.stored) input.value = '';
    input.setAttribute('aria-describedby', this.stored || this.replacing ? this.hint.id : '');
    if (!this.stored && !this.replacing) input.removeAttribute('aria-describedby');
    this.eyeBtn.hidden = this.stored;
    this.eyeBtn.setAttribute('aria-pressed', String(on));
    this.eyeBtn.setAttribute('aria-label', t(on ? 'secretHide' : 'secretShow'));
    this.eyeBtn.replaceChildren(iconEl(on ? 'eye-off' : 'eye'));
    this.replaceBtn.hidden = !this.stored;
    this.hint.hidden = !this.stored && !this.replacing;
    (this.hint.querySelector('.op-secret__note') as HTMLElement).hidden = !this.stored;
    this.keepBtn.hidden = !this.replacing;
    this.el.classList.toggle('is-stored', this.stored);
    this.el.classList.toggle('is-replacing', this.replacing);
    this.el.classList.toggle('is-revealed', on);
    this.el.classList.toggle('has-value', this.stored || !!input.value);
  }
}
register('secretfield', SecretField);
