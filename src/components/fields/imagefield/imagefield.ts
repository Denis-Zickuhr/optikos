import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';

addMessages('en', {
  imgDrop: 'Drop an image here or click to choose',
  imgType: '{name} is not an accepted image type',
  imgSize: '{name} is larger than {max}',
  imgCount: 'At most {n} images',
  imgRemove: 'Remove {name}',
});
addMessages('pt-BR', {
  imgDrop: 'Solte uma imagem aqui ou clique para escolher',
  imgType: '{name} não é um tipo de imagem aceito',
  imgSize: '{name} é maior que {max}',
  imgCount: 'No máximo {n} imagens',
  imgRemove: 'Remover {name}',
});

/** A new `File`, or the URL (string) of an image already saved. */
export type ImageItem = File | string;
export type ImageValue = ImageItem | ImageItem[] | null;

export interface ImageFieldConfig extends FieldConfig<ImageValue> {
  /** The input's `accept` (also checked on dropped files). Default `image/*`. */
  accept?: string;
  /** Bytes. */
  maxSize?: number;
  multiple?: boolean;
  /** With `multiple`. */
  maxFiles?: number;
  placeholder?: string;
}

const nameOf = (i: ImageItem) => (typeof i === 'string' ? (i.split(/[?#]/)[0].split('/').pop() ?? i) : i.name);

/** Picks images by click or drop, with a preview. Holds the files; sending them is up to the app. */
export class ImageField extends Field<ImageValue, ImageFieldConfig> {
  protected override baseCls = 'op-field op-imagefield';
  private zone!: HTMLButtonElement;
  private picker!: HTMLInputElement;
  private list!: HTMLElement;
  private urls: string[] = [];

  protected override emptyValue(): ImageValue {
    return this.config.multiple ? [] : null;
  }
  protected override isEmpty(v: ImageValue): boolean {
    return !this.itemsOf(v).length;
  }
  protected override isEqual(a: ImageValue, b: ImageValue): boolean {
    const x = this.itemsOf(a);
    const y = this.itemsOf(b);
    return x.length === y.length && x.every((i, k) => i === y[k]);
  }

  private itemsOf(v: ImageValue): ImageItem[] {
    return v == null ? [] : Array.isArray(v) ? v : [v];
  }
  private items(): ImageItem[] {
    return this.itemsOf(this.value);
  }

  protected createControl() {
    this.zone = h('button', 'op-imagefield__zone', { type: 'button' }, iconEl('image'), h('span', 'op-imagefield__hint'));
    this.inputEl = this.zone;
    this.picker = h('input', 'op-imagefield__picker', { type: 'file', tabindex: -1, 'aria-hidden': 'true' });
    this.list = h('div', 'op-imagefield__list', { role: 'list' });
    this.listen(this.zone, 'click', () => this.open());
    this.listen(this.picker, 'change', () => {
      this.add(Array.from(this.picker.files ?? []));
      this.picker.value = '';
    });
    this.listen(this.zone, 'dragover', (e: DragEvent) => {
      e.preventDefault();
      this.el.classList.add('is-dragover');
    });
    this.listen(this.zone, 'dragleave', () => this.el.classList.remove('is-dragover'));
    this.listen(this.zone, 'drop', (e: DragEvent) => {
      e.preventDefault();
      this.el.classList.remove('is-dragover');
      this.add(Array.from(e.dataTransfer?.files ?? []));
    });
    this.listen(this.list, 'click', (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('.op-imagefield__remove');
      if (b) this.remove(Number(b.dataset.i));
    });
    this.own(() => this.revoke());
    return h('div', 'op-imagefield__box', {}, this.zone, this.picker, this.list);
  }

  protected override onRender() {
    this.picker.accept = this.config.accept ?? 'image/*';
    this.picker.multiple = !!this.config.multiple;
    (this.zone.querySelector('.op-imagefield__hint') as HTMLElement).textContent = this.config.placeholder ?? t('imgDrop');
    super.onRender();
  }

  protected applyValue(v: ImageValue) {
    this.revoke();
    this.list.replaceChildren(
      ...this.itemsOf(v).map((it, i) => {
        const src = typeof it === 'string' ? it : this.url(it);
        return h('div', 'op-imagefield__item', { role: 'listitem' },
          h('img', 'op-imagefield__img', { src, alt: '' }),
          h('span', 'op-imagefield__name', {}, nameOf(it)),
          h('button', 'op-imagefield__remove', { type: 'button', 'data-i': i, 'aria-label': t('imgRemove', { name: nameOf(it) }) }, iconEl('x')));
      }),
    );
    this.sync();
  }

  private url(f: File): string {
    const u = URL.createObjectURL(f);
    this.urls.push(u);
    return u;
  }
  private revoke() {
    for (const u of this.urls.splice(0)) URL.revokeObjectURL(u);
  }

  /** The zone is there only while there is room for another image and the user may edit. */
  private sync() {
    const c = this.config;
    const n = this.items().length;
    const full = c.multiple ? !!c.maxFiles && n >= c.maxFiles : n > 0;
    this.zone.hidden = full || !!c.readonly;
    this.zone.disabled = this.picker.disabled = !!c.disabled;
    for (const b of this.list.querySelectorAll<HTMLButtonElement>('.op-imagefield__remove')) {
      b.hidden = !!c.readonly;
      b.disabled = !!c.disabled;
    }
  }
  protected override onDisabled() {
    this.sync();
  }
  protected override onReadonly() {
    this.sync();
  }

  /** Opens the browser's file picker. */
  open(): void {
    if (!this.config.disabled && !this.config.readonly) this.picker.click();
  }

  private accepts(f: File): boolean {
    const rules = (this.config.accept ?? 'image/*').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const name = f.name.toLowerCase();
    return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? f.type.startsWith(r.slice(0, -1)) : f.type === r));
  }

  /** Adds files with the same checks as a drop. Without `multiple` the first valid file replaces the image. */
  add(files: File[]): void {
    const c = this.config;
    if (c.disabled || c.readonly) return;
    const had = this.holdsFocus();
    const ok: File[] = [];
    let message = '';
    const room = c.multiple ? (c.maxFiles ?? Infinity) - this.items().length : 1;
    for (const f of files) {
      let reason: 'type' | 'size' | 'count' | '' = '';
      if (!this.accepts(f)) reason = 'type';
      else if (c.maxSize != null && f.size > c.maxSize) reason = 'size';
      else if (ok.length >= room || (!c.multiple && ok.length)) reason = 'count';
      if (!reason) {
        ok.push(f);
        continue;
      }
      const max = c.maxSize != null ? (c.maxSize >= 1048576 ? `${+(c.maxSize / 1048576).toFixed(1)} MB` : `${+(c.maxSize / 1024).toFixed(1)} KB`) : '';
      message = t(`img${reason[0].toUpperCase()}${reason.slice(1)}`, { name: f.name, max, n: c.maxFiles ?? 1 });
      this.emit('reject', f, reason);
    }
    if (ok.length) this.commit(c.multiple ? [...this.items(), ...ok] : ok[0]);
    if (message) this.setError(message);
    else if (ok.length) this.clearError();
    if (had) this.refocus();
  }

  /** Removes the image at `index`. */
  remove(index: number): void {
    if (this.config.disabled || this.config.readonly) return;
    const had = this.holdsFocus();
    const left = this.items().filter((_, i) => i !== index);
    this.commit(this.config.multiple ? left : null);
    if (had) this.refocus();
  }

  protected override commit(v: ImageValue) {
    super.commit(v);
    this.applyValue(v);
  }

  private holdsFocus(): boolean {
    return this.el.contains(document.activeElement);
  }

  /** The button the keyboard user was on may be gone: move to the one that is left. */
  private refocus() {
    (this.zone.hidden ? this.list.querySelector<HTMLElement>('.op-imagefield__remove') : this.zone)?.focus();
  }

  override getDisplayText(): string {
    return this.items().map(nameOf).join(', ');
  }
}
register('imagefield', ImageField);
