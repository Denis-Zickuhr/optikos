import { Field, type FieldConfig } from '../../../core/field';
import { Container } from '../../../core/container';
import { register, type AnyConfig } from '../../../core/registry';
import { h } from '../../../core/dom';
import { addMessages, t } from '../../../core/i18n';
import type { LayoutSpec } from '../../../layout/layout';
import { Component } from '../../../core/component';
import { iconEl } from '../../base/icon/icon';
import { setPath } from '../../../core/path';

addMessages('en', { flAdd: 'Add', flRemove: 'Remove {row}', flUp: 'Move {row} up', flDown: 'Move {row} down', flEmpty: 'Nothing added yet', flMin: 'Add at least {n}', flMax: 'At most {n}' });
addMessages('pt-BR', { flAdd: 'Adicionar', flRemove: 'Remover {row}', flUp: 'Subir {row}', flDown: 'Descer {row}', flEmpty: 'Nada adicionado ainda', flMin: 'Adicione pelo menos {n}', flMax: 'No máximo {n}' });

type Row = Record<string, any>;

export interface FieldListConfig extends FieldConfig<Row[]> {
  /** The fields of one row (configs or instances such as `ui.text(...)`). Names are relative to the row (nested allowed). */
  items?: Array<AnyConfig | Component>;
  min?: number;
  max?: number;
  addText?: string;
  reorderable?: boolean;
  /** Values for a new row, or a function that returns them. */
  newRow?: Row | (() => Row);
  /** Layout of a row. Default `hbox` (the fields share the row). */
  rowLayout?: LayoutSpec;
}

/** A repeating block of fields: add, remove and reorder rows; the value is an array of row objects. */
export class FieldList extends Field<Row[], FieldListConfig> {
  protected override baseCls = 'op-field op-fieldlist';
  private rowsEl!: HTMLElement;
  private addBtn!: HTMLButtonElement;
  private emptyEl!: HTMLElement;
  private rows: Container[] = [];
  private syncing = false;

  protected override emptyValue(): Row[] {
    return [];
  }
  protected override isEmpty(v: Row[]): boolean {
    return !v?.length;
  }

  protected createControl() {
    this.rowsEl = h('div', 'op-fieldlist__rows', { role: 'group' });
    this.emptyEl = h('div', 'op-fieldlist__empty', {}, t('flEmpty'));
    this.addBtn = h('button', 'op-fieldlist__add', { type: 'button' }, iconEl('plus'), h('span', '', {}, this.config.addText ?? t('flAdd')));
    this.listen(this.addBtn, 'click', () => this.addRow());
    this.inputEl = this.addBtn;
    return h('div', 'op-fieldlist__box', {}, this.rowsEl, this.emptyEl, this.addBtn);
  }

  protected override onRender() {
    super.onRender();
    this.rowsEl.setAttribute('aria-labelledby', (this.el.querySelector('.op-field__label') as HTMLElement).id ||= `${this.id}-label`);
  }

  // ---- rows ---------------------------------------------------------------------------------

  private label(i: number): string {
    return `${this.config.label ?? ''} ${i + 1}`.trim();
  }

  private makeRow(values: Row): Container {
    // every row gets fresh fields: a config is copied, an instance (`ui.text(...)`) is rebuilt from a copy of its config
    const fresh = (c: AnyConfig | Component): AnyConfig | Component => {
      const cfg = (c instanceof Component ? c.config : c) as AnyConfig;
      const copy = { ...cfg, ...(Array.isArray(cfg.items) ? { items: (cfg.items as Array<AnyConfig | Component>).map(fresh) } : {}) };
      return c instanceof Component ? new (c.constructor as new (cfg: object) => Component)(copy) : copy;
    };
    const row = new Container({ cls: 'op-fieldlist__row', layout: this.config.rowLayout ?? { type: 'hbox', align: 'flex-start' }, items: (this.config.items ?? []).map(fresh) });
    for (const c of row.items) if (c.config.width != null && c.config.flex == null) c.config.flex = 'none'; // a set width is kept
    for (const f of this.rowFields(row)) {
      f.fillFrom(values);
      f.on('change', () => this.syncing || this.commitRows());
    }
    return row;
  }

  private rowFields(row: Container): Field<any>[] {
    return row.query((c) => c instanceof Field) as Field<any>[];
  }

  private collect(): Row[] {
    return this.rows.map((row) => {
      const out: Row = {};
      for (const f of this.rowFields(row)) if (f.name) setPath(out, f.name, f.getValue());
      return out;
    });
  }

  private commitRows() {
    this.commit(this.collect());
    this.paintRows();
    if (this.getError()) this.validate();
  }

  /** Puts every row in place: its group name, tools, and which tools are allowed. */
  private paintRows() {
    if (!this.rendered) return;
    const { min = 0, max = Infinity, reorderable = true } = this.config;
    this.rowsEl.replaceChildren(
      ...this.rows.map((row, i) => {
        const el = row.el;
        el.setAttribute('role', 'group');
        el.setAttribute('aria-label', this.label(i));
        el.classList.toggle('is-first', i === 0);
        el.querySelector(':scope > .op-fieldlist__tools')?.remove();
        const tool = (icon: string, key: string, disabled: boolean, run: () => void) => {
          const b = h('button', 'op-fieldlist__tool', { type: 'button', 'data-act': key, 'aria-label': t(key, { row: this.label(i) }), 'data-op-tip': t(key, { row: this.label(i) }) }, iconEl(icon));
          b.disabled = disabled || !!this.config.disabled || !!this.config.readonly;
          b.addEventListener('click', run);
          return b;
        };
        const tools = h('div', 'op-fieldlist__tools');
        if (reorderable) tools.append(tool('chevron-up', 'flUp', i === 0, () => this.moveRow(i, i - 1)), tool('chevron-down', 'flDown', i === this.rows.length - 1, () => this.moveRow(i, i + 1)));
        tools.append(tool('trash', 'flRemove', this.rows.length <= min, () => this.removeRow(i)));
        el.append(tools);
        return el;
      }),
    );
    this.emptyEl.hidden = this.rows.length > 0;
    this.el.classList.toggle('is-empty', !this.rows.length);
    this.addBtn.disabled = this.rows.length >= max || !!this.config.disabled || !!this.config.readonly;
  }

  protected applyValue(value: Row[]): void {
    this.syncing = true;
    this.rows.forEach((r) => r.destroy());
    this.rows = (value ?? []).map((v) => this.makeRow(v));
    this.syncing = false;
    const was = this.isEqual(this.original, value);
    this.value = this.collect(); // what the rows actually hold (a missing key becomes the field's empty value)
    if (was) this.original = this.value; // normalizing the starting value does not make the form dirty
    this.paintRows();
  }

  /** Adds a row (at the end) and focuses its first field. */
  addRow(values?: Row): void {
    const max = this.config.max ?? Infinity;
    if (this.rows.length >= max) return;
    const n = this.config.newRow;
    this.rows.push(this.makeRow(values ?? (typeof n === 'function' ? n() : { ...n })));
    this.commitRows();
    this.emit('add', this.rows.length - 1);
    this.rowFields(this.rows[this.rows.length - 1])[0]?.focus();
  }

  removeRow(index: number): void {
    if (!this.rows[index] || this.rows.length <= (this.config.min ?? 0) || this.emit('before-remove', index) === false) return;
    const [row] = this.rows.splice(index, 1);
    row.destroy();
    this.commitRows();
    this.emit('remove', index);
    const next = this.rows[Math.min(index, this.rows.length - 1)];
    if (next) this.rowFields(next)[0]?.focus();
    else if (this.rendered) this.addBtn.focus();
  }

  moveRow(from: number, to: number): void {
    if (!this.rows[from] || to < 0 || to >= this.rows.length || from === to) return;
    const [row] = this.rows.splice(from, 1);
    this.rows.splice(to, 0, row);
    this.commitRows();
    this.emit('move', from, to);
    // the focus follows the row: the same tool if it can still move that way, the other one at the end of the list
    const tools = ['flUp', 'flDown'].map((k) => row.el.querySelector<HTMLButtonElement>(`[data-act="${k}"]`));
    (to < from ? tools : tools.reverse()).find((b) => b && !b.disabled)?.focus();
  }

  getRows(): Container[] {
    return this.rows;
  }
  getRowFields(index: number): Field<any>[] {
    return this.rows[index] ? this.rowFields(this.rows[index]) : [];
  }

  /** The field of a row by path (`'0.name'` → field `name` of the first row): where a server error lands. */
  fieldAt(path: string): Field<any> | undefined {
    const [i, ...rest] = path.split('.');
    return this.getRowFields(Number(i)).find((f) => f.name === rest.join('.'));
  }

  setAddText(text: string): void {
    this.config.addText = text;
    if (this.rendered) this.addBtn.lastElementChild!.textContent = text;
  }

  setMin(min: number): void {
    this.config.min = min;
    this.paintRows();
  }
  setMax(max: number): void {
    this.config.max = max;
    this.paintRows();
  }

  // ---- validation ---------------------------------------------------------------------------

  protected override check(): string {
    const n = this.value?.length ?? 0;
    const { min = 0, max = Infinity } = this.config;
    if (n && n < min) return t('flMin', { n: min });
    if (n > max) return t('flMax', { n: max });
    return super.check();
  }

  /** Validates every row too; the list is valid when its own rules and every field inside pass. */
  override validate(): boolean {
    const inner = this.rows.flatMap((r) => this.rowFields(r)).map((f) => f.validate()).every(Boolean);
    return super.validate() && inner;
  }

  override isValid(): boolean {
    return super.isValid() && this.rows.every((r) => this.rowFields(r).every((f) => f.isValid()));
  }

  /** The first invalid field inside, or the add button. */
  override focus(): void {
    const bad = this.rows.flatMap((r) => this.rowFields(r)).find((f) => f.getError());
    if (bad) bad.focus();
    else this.addBtn?.focus();
  }

  protected override onDisabled(disabled: boolean) {
    this.rows.forEach((r) => r.setDisabled(disabled));
    this.paintRows();
  }
  protected override onReadonly(readonly: boolean) {
    this.rows.forEach((r) => this.rowFields(r).forEach((f) => f.setReadonly(readonly)));
    this.paintRows();
  }

  protected override onDestroy(): void {
    this.rows.forEach((r) => r.destroy());
    super.onDestroy();
  }
}
register('fieldlist', FieldList);
