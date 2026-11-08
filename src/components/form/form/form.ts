import { Container, type ContainerConfig } from '../../../core/container';
import { Field } from '../../../core/field';
import { register } from '../../../core/registry';
import type { Model } from '../../../data/model';
import type { Component } from '../../../core/component';
import type { LayoutSpec } from '../../../layout/layout';

export interface FormTab {
  title: string;
  icon?: string;
  items: ContainerConfig['items'];
  /** Default: two columns (one on a phone). */
  layout?: LayoutSpec;
}

export interface FormConfig extends ContainerConfig {
  /** Shortcut: the fields in tabs, still one form (one `getValues`, one `validate`, one dirty). */
  tabs?: FormTab[];
  /** Default `labelPos` for fields that do not set their own. */
  labelPos?: 'top' | 'left';
  readonly?: boolean;
}

const getPath = (o: any, path: string) => path.split('.').reduce((v, k) => v?.[k], o);
function setPath(o: any, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((v, k) => (v[k] ??= {}), o);
  target[last] = value;
}

export class Form extends Container<FormConfig> {
  protected override baseCls = 'op-form';
  protected override tag = 'form' as const;

  constructor(config: FormConfig = {}) {
    const items = [...(config.items ?? [])];
    if (config.tabs) {
      items.push({
        type: 'tabs',
        flex: 1,
        items: config.tabs.map((t) => ({ type: 'container', title: t.title, icon: t.icon, cls: 'op-form__tab', layout: t.layout ?? { type: 'grid', columns: 2, gap: 12 }, items: t.items })),
      } as never);
    }
    super({ ...config, items });
  }

  protected override build() {
    const el = super.build();
    el.setAttribute('novalidate', '');
    return el;
  }

  protected override onRender() {
    this.config.layout ??= { type: 'vbox' };
    if (this.config.labelPos) for (const f of this.getFields()) f.config.labelPos ??= this.config.labelPos;
    super.onRender();
    if (this.config.readonly) this.setReadonly(true);
    for (const f of this.getFields()) for (const ev of ['invalid', 'valid', 'dirty-change', 'change']) f.on(ev, () => this.syncTabs());
    // Native submit (a `type=submit` button) and Enter inside a single-line field both go through submit().
    this.listen(this.el, 'submit', (e: Event) => {
      e.preventDefault();
      this.submit();
    });
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === 'Enter' && t instanceof HTMLInputElement && !e.defaultPrevented && t.type !== 'button') {
        e.preventDefault();
        this.submit();
      }
    });
  }

  getFields(): Field<any>[] {
    return this.query((c) => c instanceof Field) as Field<any>[];
  }

  getField(name: string): Field<any> | undefined {
    return this.getFields().find((f) => f.name === name);
  }

  /** Nested object built from field names (`address.city` → `{ address: { city } }`). */
  getValues(opts: { dirtyOnly?: boolean } = {}): Record<string, any> {
    const out: Record<string, any> = {};
    for (const f of this.getFields()) if (f.name && (!opts.dirtyOnly || f.isDirty())) setPath(out, f.name, f.getValue());
    return out;
  }

  /** Sets the fields present in `values` (silently). */
  setValues(values: Record<string, any>): void {
    for (const f of this.getFields()) {
      const v = f.name ? getPath(values, f.name) : undefined;
      if (v !== undefined) f.setValue(v, true);
    }
  }

  /** Fills the form from a plain object or a Model, and makes it the "clean" state. */
  load(record: Record<string, any> | Model): void {
    this.setValues('data' in record && 'get' in record ? (record as Model).data : record);
    this.markClean();
    this.clearErrors();
    this.emit('load', record);
  }

  /** Brings a field into view: asks every ancestor that shows one child at a time (Tabs, a card layout) to show the branch. */
  protected reveal(field: Component): void {
    let node: Component = field;
    while (node.parent) {
      const p = node.parent as any;
      if (p.items?.includes(node)) {
        if (typeof p.setActive === 'function') p.setActive(node);
        else if (p.layout?.activate) p.layout.activate(p, node);
      }
      node = p;
    }
  }

  /** Error counts and "changed" dots on the headers of every Tabs inside the form. */
  protected syncTabs(): void {
    for (const tabs of this.query((c) => typeof (c as any).setTabState === 'function') as any[]) {
      for (const panel of tabs.items as Component[]) {
        const fields = panel instanceof Container ? (panel.query((c) => c instanceof Field) as Field<any>[]) : [];
        tabs.setTabState(panel, { errors: fields.filter((f) => f.getError()).length, dirty: fields.some((f) => f.isDirty()) });
      }
    }
  }

  /** Writes the changed fields back into a Model. */
  updateRecord(model: Model): void {
    const all = this.getValues();
    const keys = new Set(this.getFields().filter((f) => f.name && f.isDirty()).map((f) => f.name!.split('.')[0]));
    for (const k of keys) model.set(k, all[k]);
  }

  markClean(): void {
    this.getFields().forEach((f) => f.markClean());
    this.syncTabs();
  }
  reset(): void {
    this.getFields().forEach((f) => f.reset());
    this.syncTabs();
  }
  isDirty(): boolean {
    return this.getFields().some((f) => f.isDirty());
  }
  isValid(): boolean {
    return this.getFields().every((f) => f.isValid());
  }
  clearErrors(): void {
    this.getFields().forEach((f) => f.clearError());
    this.syncTabs();
  }

  /** Validates every field (marks errors) and focuses the first invalid one. */
  validate(): boolean {
    const bad = this.getFields().filter((f) => !f.validate());
    this.syncTabs();
    if (bad.length) {
      this.reveal(bad[0]); // the tab / step that holds it comes forward first
      bad[0].focus();
      this.emit('invalid', bad);
    }
    this.el.classList.toggle('is-invalid', !!bad.length);
    return !bad.length;
  }

  submit(): boolean {
    if (this.emit('before-submit') === false) return false;
    if (!this.validate()) return false;
    this.emit('submit', this.getValues());
    return true;
  }

  setReadonly(readonly: boolean): void {
    this.config.readonly = readonly;
    this.getFields().forEach((f) => f.setReadonly(readonly));
  }
}
register('form', Form);
