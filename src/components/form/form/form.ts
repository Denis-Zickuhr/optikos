import { Container, type ContainerConfig } from '../../../core/container';
import { Field } from '../../../core/field';
import { register } from '../../../core/registry';
import type { Model } from '../../../data/model';
import type { Component } from '../../../core/component';
import type { LayoutSpec } from '../../../layout/layout';
import { px } from '../../../core/dom';
import { setPath } from '../../../core/path';

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
  /** Width of the labels on the left (`labelPos: 'left'`), so they line up in a column. Number = px. */
  labelWidth?: number | string;
  /** Shortcut for a responsive grid layout (one column on narrow screens); items take `colspan` (a number or `'full'`). */
  columns?: number;
  readonly?: boolean;
}

export class Form extends Container<FormConfig> {
  protected override baseCls = 'op-form';
  protected override tag = 'form' as const;
  /** Components hidden by their `showIf` rule: their fields do not count (no validation, not in `getValues`). */
  private ruledOut = new Set<Component>();
  private dirty = false;

  constructor(config: FormConfig = {}) {
    const items = [...(config.items ?? [])];
    if (config.tabs) {
      items.push({
        type: 'tabs',
        flex: 1,
        items: config.tabs.map((t) => ({ type: 'container', title: t.title, icon: t.icon, cls: 'op-form__tab', layout: t.layout ?? { type: 'grid', columns: 2, gap: 12 }, items: t.items })),
      });
    }
    super({ ...config, items });
  }

  protected override build() {
    const el = super.build();
    el.setAttribute('novalidate', '');
    return el;
  }

  protected override onRender() {
    this.config.layout ??= this.config.columns ? { type: 'grid', columns: this.config.columns } : { type: 'vbox' };
    if (this.config.labelWidth != null) this.setLabelWidth(this.config.labelWidth);
    if (this.config.labelPos) for (const f of this.getFields()) f.config.labelPos ??= this.config.labelPos;
    super.onRender();
    if (this.config.readonly) this.setReadonly(true);
    for (const f of this.getFields()) for (const ev of ['invalid', 'valid', 'dirty-change', 'change']) f.on(ev, () => this.syncTabs());
    for (const f of this.getFields()) f.on('change', () => this.changed());
    for (const f of this.getFields()) f.on('dirty-change', () => this.changed());
    this.applyRules();
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

  /** Nested object built from field names (`address.city` → `{ address: { city } }`). Fields hidden by `showIf` are left out. */
  getValues(opts: { dirtyOnly?: boolean } = {}): Record<string, any> {
    const out: Record<string, any> = {};
    for (const f of this.counted()) if (f.name && (!opts.dirtyOnly || f.isDirty())) setPath(out, f.name, f.getValue());
    return out;
  }

  /** The fields that count: not inside something its `showIf` rule hid. */
  private counted(): Field<any>[] {
    return this.getFields().filter((f) => {
      for (let c: Component | undefined = f; c && c !== this; c = c.parent as Component | undefined) if (this.ruledOut.has(c)) return false;
      return true;
    });
  }

  /** A field changed: rerun the `showIf`/`enableIf` rules and say when the form as a whole became (un)changed. */
  private changed(): void {
    this.applyRules();
    const d = this.isDirty();
    if (d !== this.dirty) this.emit('dirty-change', (this.dirty = d));
  }

  /** Shows/hides and enables/disables every item that has a rule, from the current values (hidden fields included). */
  applyRules(): void {
    const values: Record<string, any> = {};
    for (const f of this.getFields()) if (f.name) setPath(values, f.name, f.getValue());
    for (const c of this.query((x) => !!(x.config.showIf || x.config.enableIf))) {
      const { showIf, enableIf } = c.config;
      if (showIf) {
        const show = !!showIf(values);
        if (show === this.ruledOut.has(c)) {
          if (show) (this.ruledOut.delete(c), c.show());
          else {
            this.ruledOut.add(c);
            c.hide();
            // what nobody can see has nothing to fix: its errors go with it
            for (const f of c instanceof Field ? [c] : c instanceof Container ? (c.query((x) => x instanceof Field) as Field<any>[]) : []) f.clearError();
          }
        }
      }
      if (enableIf) c.setDisabled(!enableIf(values));
    }
  }

  /** Brings a field into view (opening its tab or step) and focuses it. */
  focusField(field: Field<any>): void {
    this.reveal(field);
    field.focus();
  }

  /** Sets the fields present in `values` (silently). */
  setValues(values: Record<string, any>): void {
    for (const f of this.getFields()) f.fillFrom(values);
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
    return this.counted().every((f) => f.config.disabled || f.isValid());
  }
  clearErrors(): void {
    this.getFields().forEach((f) => f.clearError());
    this.syncTabs();
  }

  /** Validates every field that counts (marks errors) and focuses the first invalid one. */
  validate(): boolean {
    // a hidden or disabled field is not validated: the user could not fix it
    const counted = this.counted().filter((f) => !f.config.disabled);
    for (const f of this.getFields()) if (!counted.includes(f)) f.clearError();
    const bad = counted.filter((f) => !f.validate());
    this.syncTabs();
    if (bad.length) {
      this.reveal(bad[0]); // the tab / step that holds it comes forward first
      bad[0].focus();
      this.emit('invalid', bad);
    }
    this.el.classList.toggle('is-invalid', !!bad.length);
    return !bad.length;
  }

  /**
   * Marks server-side errors by dotted path (`slug`, `items.0.name` for a row of a FieldList), brings the first into
   * view (its tab or step) and focuses it. Returns the paths that matched no field, for the caller to show some other way.
   */
  setErrors(errors: Record<string, string>): string[] {
    this.clearErrors();
    const unmatched: string[] = [];
    let first: { host: Field<any>; target: Field<any> } | undefined;
    for (const [path, msg] of Object.entries(errors)) {
      const fields = this.getFields().filter((f) => f.name);
      const host = fields.find((f) => f.name === path) ?? fields.filter((f) => path.startsWith(f.name + '.')).sort((a, b) => b.name!.length - a.name!.length)[0];
      if (host) host.render();
      const target = host?.name === path ? host : (host as any)?.fieldAt?.(path.slice(host!.name!.length + 1));
      if (!target) unmatched.push(path);
      else {
        target.setError(msg);
        first ??= { host: host!, target };
      }
    }
    this.syncTabs();
    if (first) {
      this.el.classList.add('is-invalid');
      this.emit('invalid', this.getFields().filter((f) => f.getError()));
      this.reveal(first.host);
      first.target.focus();
    }
    return unmatched;
  }

  submit(): boolean {
    if (this.emit('before-submit') === false) return false;
    if (!this.validate()) return false;
    this.emit('submit', this.getValues());
    return true;
  }

  /** Width of the labels on the left (number = px); they line up in a column. */
  setLabelWidth(width: number | string): void {
    this.config.labelWidth = width;
    if (this.rendered) this.el.style.setProperty('--op-field-label-width', px(width));
  }

  setReadonly(readonly: boolean): void {
    this.config.readonly = readonly;
    this.getFields().forEach((f) => f.setReadonly(readonly));
  }
}
register('form', Form);
