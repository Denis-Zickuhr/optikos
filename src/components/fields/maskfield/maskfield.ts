import { TextField, type TextFieldConfig } from '../textfield/textfield';
import { register } from '../../../core/registry';
import { t, addMessages } from '../../../core/i18n';

addMessages('en', { maskIncomplete: 'Complete the format {mask}', maskStored: 'Saved. Press Enter or type to replace it, Esc to keep it.' });
addMessages('pt-BR', { maskIncomplete: 'Complete o formato {mask}', maskStored: 'Salvo. Pressione Enter ou digite para trocar, Esc para manter.' });

export interface MaskFieldConfig extends TextFieldConfig<string | null> {
  /**
   * The pattern: `0` a digit, `A` a letter, `*` any character, `\` makes the next character a literal. A list picks the
   * pattern by length: `['000.000.000-00', '00.000.000/0000-00']` is a CPF until the 12th digit, then a CNPJ.
   * The core knows no country: formats like these belong to the app.
   */
  mask: string | string[];
  /** The value is only what was typed into the slots (`12345678900`), not the formatted text (`123.456.789-00`). Default false. */
  raw?: boolean;
  /**
   * A value the app already holds but only shows masked (`'***.***.***-12'`): it is displayed read-only, `getValue()` is
   * `null` while untouched (keep what is saved), and typing (or Enter) replaces it. Esc on an empty replacement keeps it.
   */
  stored?: string;
}

type Slot = { kind: '0' | 'A' | '*' } | { lit: string };
const KINDS: Record<string, RegExp> = { 0: /\d/, A: /\p{L}/u, '*': /./su };

function compile(mask: string): Slot[] {
  const out: Slot[] = [];
  for (let i = 0; i < mask.length; i++) {
    const ch = mask[i];
    if (ch === '\\' && i + 1 < mask.length) out.push({ lit: mask[++i] });
    else out.push(ch in KINDS ? { kind: ch as '0' | 'A' | '*' } : { lit: ch });
  }
  return out;
}
const slots = (m: Slot[]) => m.filter((s) => 'kind' in s).length;

/** A text field that formats what is typed into a pattern (phone, tax id, postal code, plate...). */
export class MaskField extends TextField<string | null, MaskFieldConfig> {
  protected override baseCls = 'op-field op-textfield op-maskfield';
  private masks: Slot[][] = [];
  private keeping: boolean;

  constructor(config: MaskFieldConfig) {
    super(config);
    this.keeping = !!config.stored;
  }

  private compiled(): Slot[][] {
    const m = this.config.mask;
    return (this.masks = (Array.isArray(m) ? m : [m]).map(compile).sort((a, b) => slots(a) - slots(b)));
  }

  /** What was typed into the slots: the literals of the patterns are dropped (with a `*` slot, only where the text repeats one). */
  private extract(text: string): string {
    const masks = this.masks.length ? this.masks : this.compiled();
    const lits = new Set(masks.flatMap((m) => m.flatMap((s) => ('lit' in s ? [s.lit] : []))));
    const wild = masks.some((m) => m.some((s) => 'kind' in s && s.kind === '*'));
    let out = '';
    for (const ch of text) if (!(lits.has(ch) && (!wild || !/[\p{L}\d]/u.test(ch)))) out += ch;
    return out;
  }

  private pick(raw: string): Slot[] {
    const masks = this.masks.length ? this.masks : this.compiled();
    return masks.find((m) => slots(m) >= raw.length) ?? masks[masks.length - 1];
  }

  private format(raw: string, mask = this.pick(raw)): string {
    let out = '';
    let i = 0;
    for (const s of mask) {
      if (i >= raw.length) break;
      if ('lit' in s) {
        out += s.lit;
        continue;
      }
      while (i < raw.length && !KINDS[s.kind].test(raw[i])) i++;
      if (i < raw.length) out += raw[i++];
    }
    return out;
  }

  private norm(v: string | null): string {
    const text = this.format(this.extract(v ?? ''));
    return this.config.raw ? this.extract(text) : text;
  }

  protected override display(v: string | null): string {
    return this.format(this.extract(v ?? ''));
  }

  /** A saved value that was not touched counts as filled in (so `required` is satisfied). */
  protected override isEmpty(v: string | null) {
    return !this.keeping && super.isEmpty(v);
  }

  override getValue(): string | null {
    return this.keeping ? null : super.getValue();
  }

  override setValue(v: string | null, silent = false): void {
    super.setValue(this.norm(v), silent);
  }

  /** `true` while the saved value is shown and nothing has replaced it. */
  isStored(): boolean {
    return this.keeping;
  }

  /** Back to the saved value (what Esc does on an empty replacement). */
  keepStored(): void {
    if (!this.config.stored || this.keeping) return;
    this.keeping = true;
    this.showStored();
    this.el.classList.add('is-stored', 'has-value');
    this.emit('change', null, this.value);
  }

  /** Opens the field for a new value. */
  replaceStored(): void {
    if (!this.keeping) return;
    this.keeping = false;
    this.input.readOnly = !!this.config.readonly;
    this.input.removeAttribute('aria-description');
    this.el.classList.remove('is-stored');
    this.input.value = '';
    this.el.classList.remove('has-value');
    this.setValue('');
    this.input.focus();
  }

  private showStored() {
    this.input.readOnly = true;
    this.input.value = this.config.stored ?? '';
    this.input.setAttribute('aria-description', t('maskStored'));
  }

  protected override applyValue(v: string | null): void {
    if (this.keeping) return this.showStored();
    super.applyValue(v);
  }

  protected override onRender() {
    super.onRender();
    this.el.classList.toggle('is-stored', this.keeping);
    if (this.keeping) this.el.classList.add('has-value');
  }

  protected override createControl() {
    const wrap = super.createControl();
    const sample = this.compiled()[0];
    if (!this.config.placeholder) this.input.placeholder = sample.map((s) => ('lit' in s ? s.lit : '_')).join('');
    if (this.masks.every((m) => m.every((s) => 'lit' in s || s.kind === '0'))) this.input.setAttribute('inputmode', 'numeric');
    if (this.keeping) this.showStored();
    this.listen(this.input, 'click', () => this.replaceStored());
    this.listen(this.input, 'keydown', (e: KeyboardEvent) => {
      if (this.keeping && (e.key === 'Enter' || e.key === ' ')) return e.preventDefault(), this.replaceStored();
      if (e.key === 'Escape' && !this.keeping && this.config.stored && !this.input.value) this.keepStored();
    });
    return wrap;
  }

  protected override onInput() {
    const input = this.input;
    const caret = input.selectionStart ?? input.value.length;
    const before = this.extract(input.value.slice(0, caret)).length;
    const raw = this.extract(input.value);
    const text = this.format(raw);
    const atEnd = caret >= input.value.length;
    input.value = text;
    if (!atEnd && document.activeElement === input) {
      // the caret stays after the same number of typed characters
      let n = 0;
      let pos = 0;
      while (pos < text.length && n < before) if (this.extract(text[pos++]).length) n++;
      input.setSelectionRange(pos, pos);
    }
    this.el.classList.toggle('has-value', !!text);
    this.commit(this.config.raw ? this.extract(text) : text);
    if (this.error) this.validate();
  }

  protected override check(): string {
    if (this.keeping) return '';
    const base = super.check();
    const raw = this.extract(this.value ?? '');
    if (base || !raw) return base;
    const mask = this.pick(raw);
    if (raw.length < slots(mask)) return t('maskIncomplete', { mask: mask.map((s) => ('lit' in s ? s.lit : '_')).join('') });
    return '';
  }

  setMask(mask: string | string[]) {
    this.config.mask = mask;
    this.compiled();
    if (this.rendered) this.setValue(this.value, true);
  }
}
register('maskfield', MaskField);
