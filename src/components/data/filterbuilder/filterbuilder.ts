import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { FilterGroup, FilterNode, FilterOp } from '../../../data/proxy';
import type { Store } from '../../../data/store';
import { iconEl } from '../../base/icon/icon';
import { Menu } from '../../overlays/menu/menu';
import { Button } from '../../base/button/button';
import { TextField } from '../../fields/textfield/textfield';
import { NumberField } from '../../fields/numberfield/numberfield';
import { DateField } from '../../fields/datefield/datefield';

addMessages('en', {
  fbEq: 'equals',
  fbNe: 'does not equal',
  fbContains: 'contains',
  fbNotContains: 'does not contain',
  fbStarts: 'starts with',
  fbEnds: 'ends with',
  fbGt: 'greater than',
  fbGe: 'greater than or equal',
  fbLt: 'less than',
  fbLe: 'less than or equal',
  fbBetween: 'is between',
  fbNotBetween: 'is not between',
  fbIn: 'is any of',
  fbNin: 'is none of',
  fbEmpty: 'is empty',
  fbNotEmpty: 'is not empty',
  fbAnd: 'Match all (AND)',
  fbOr: 'Match any (OR)',
  fbAddFilter: 'Add filter',
  fbAddGroup: 'Add group',
  fbRemove: 'Remove',
  fbClear: 'Clear all',
  fbApply: 'Apply',
  fbField: 'Field',
  fbOperator: 'Operator',
  fbValue: 'Value',
  fbTo: 'and',
  fbList: 'a, b, c',
  fbNone: 'No filters',
  fbLabel: 'Filters',
});
addMessages('pt-BR', {
  fbEq: 'igual a',
  fbNe: 'diferente de',
  fbContains: 'contém',
  fbNotContains: 'não contém',
  fbStarts: 'começa com',
  fbEnds: 'termina com',
  fbGt: 'maior que',
  fbGe: 'maior ou igual a',
  fbLt: 'menor que',
  fbLe: 'menor ou igual a',
  fbBetween: 'entre',
  fbNotBetween: 'fora do intervalo',
  fbIn: 'é um de',
  fbNin: 'não é nenhum de',
  fbEmpty: 'está vazio',
  fbNotEmpty: 'não está vazio',
  fbAnd: 'Todas (E)',
  fbOr: 'Qualquer uma (OU)',
  fbAddFilter: 'Adicionar filtro',
  fbAddGroup: 'Adicionar grupo',
  fbRemove: 'Remover',
  fbClear: 'Limpar tudo',
  fbApply: 'Aplicar',
  fbField: 'Campo',
  fbOperator: 'Operador',
  fbValue: 'Valor',
  fbTo: 'e',
  fbList: 'a, b, c',
  fbNone: 'Sem filtros',
  fbLabel: 'Filtros',
});

export interface FilterField {
  name: string;
  label?: string;
  type?: 'text' | 'number' | 'date' | 'select';
  /** For `select`: the choices. */
  options?: Array<string | number | { value: string | number; label: string }>;
}

export interface FilterBuilderConfig extends ComponentConfig {
  fields: FilterField[];
  /** Starting filters. */
  value?: FilterGroup | null;
  /** Filtered as the user edits (`live`) or when Apply is pressed. */
  store?: Store<any>;
  /** Apply on every edit (debounced). Default true. With `false` an Apply button appears. */
  live?: boolean;
  /**
   * What "Add filter" does: `'row'` (default) adds an empty row for the first field; `'pick'` first asks
   * which field to filter by (a menu of the fields) and adds the row for it.
   */
  addMode?: 'row' | 'pick';
  /** Deepest group nesting allowed. Default 3. */
  maxDepth?: number;
}

type Rule = { kind: 'rule'; id: number; field: string; op: FilterOp; value?: any; value2?: any };
type Group = { kind: 'group'; op: 'and' | 'or'; items: Array<Rule | Group> };

const OPS: Record<NonNullable<FilterField['type']>, FilterOp[]> = {
  text: ['contains', 'notContains', 'eq', 'ne', 'startsWith', 'endsWith', 'in', 'nin', 'empty', 'notEmpty'],
  number: ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'notBetween', 'empty', 'notEmpty'],
  date: ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'between', 'notBetween', 'empty', 'notEmpty'],
  select: ['eq', 'ne', 'in', 'nin', 'empty', 'notEmpty'],
};
const KEY: Record<FilterOp, string> = {
  eq: 'fbEq', ne: 'fbNe', contains: 'fbContains', notContains: 'fbNotContains', startsWith: 'fbStarts', endsWith: 'fbEnds',
  gt: 'fbGt', ge: 'fbGe', lt: 'fbLt', le: 'fbLe', between: 'fbBetween', notBetween: 'fbNotBetween', in: 'fbIn', nin: 'fbNin',
  empty: 'fbEmpty', notEmpty: 'fbNotEmpty',
};
const arity = (op: FilterOp) => (op === 'empty' || op === 'notEmpty' ? 0 : op === 'between' || op === 'notBetween' ? 2 : 1);
const isList = (op: FilterOp) => op === 'in' || op === 'nin';

/**
 * A dynamic filter editor: rows of `field · operator · value` that accumulate below each other, joined by AND or OR,
 * with nestable groups. The result is a `FilterGroup` for `Store.filter`.
 */
export class FilterBuilder extends Component<FilterBuilderConfig> {
  protected override baseCls = 'op-filterbuilder';
  private root: Group = { kind: 'group', op: 'and', items: [] };
  private parts: Component[] = [];
  private nextId = 1;
  private cancelApply?: () => void;
  private pickMenu?: Menu;

  protected override onRender() {
    this.el.setAttribute('role', 'group');
    this.el.setAttribute('aria-label', t('fbLabel'));
    if (this.config.value) this.root = this.fromNode(this.config.value) as Group;
    this.own(() => (this.parts.forEach((p) => p.destroy()), this.pickMenu?.destroy()));
    this.paint();
    if (this.config.value && this.config.store) this.apply(); // the starting filter takes effect right away
  }

  // ---- model <-> filter ----------------------------------------------------------------------

  private fromNode(n: FilterNode): Rule | Group {
    if ('filters' in n) return { kind: 'group', op: n.op, items: n.filters.map((f) => this.fromNode(f)) };
    const [a, b] = Array.isArray(n.value) && !isList(n.op ?? 'eq') ? n.value : [n.value, undefined];
    return { kind: 'rule', id: this.nextId++, field: n.field, op: n.op ?? 'eq', value: isList(n.op ?? 'eq') ? n.value : a, value2: b };
  }

  private field(name: string): FilterField {
    return this.config.fields.find((f) => f.name === name) ?? this.config.fields[0];
  }

  private complete(r: Rule): boolean {
    const n = arity(r.op);
    const has = (v: unknown) => v != null && v !== '' && !(Array.isArray(v) && !v.length);
    return n === 0 || (n === 1 ? has(r.value) : has(r.value) && has(r.value2));
  }

  private toNode(g: Group): FilterGroup | null {
    const filters = g.items.flatMap((it): FilterNode[] => {
      if (it.kind === 'group') return this.toNode(it) ? [this.toNode(it)!] : [];
      if (!this.complete(it)) return [];
      const n = arity(it.op);
      return [{ field: it.field, op: it.op, ...(n === 1 ? { value: it.value } : n === 2 ? { value: [it.value, it.value2] } : {}) }];
    });
    return filters.length ? { op: g.op, filters } : null;
  }

  /** The complete rules as a filter tree (incomplete rows are left out); null when there is nothing to filter by. */
  getFilter(): FilterGroup | null {
    return this.toNode(this.root);
  }

  setFilter(filter: FilterGroup | null): void {
    this.root = filter ? (this.fromNode(filter) as Group) : { kind: 'group', op: 'and', items: [] };
    if (this.rendered) this.paint();
    this.changed();
  }

  /** Removes every row and applies the empty filter. */
  clear(): void {
    this.setFilter(null);
    this.apply();
  }

  /** Pushes the current filter to the store and fires `apply`. */
  apply(): void {
    this.cancelApply?.();
    const f = this.getFilter();
    if (this.emit('before-apply', f) === false) return;
    const store = this.config.store;
    if (store) void (f ? store.filter(f) : store.clearFilter());
    this.emit('apply', f);
  }

  /** Adds a row (optionally for a given field) to the root group. */
  addRule(field?: string): void {
    this.root.items.push(this.newRule(field));
    if (this.rendered) this.paint();
  }

  setFields(fields: FilterField[]): void {
    this.config.fields = fields;
    if (this.rendered) this.paint();
  }

  setStore(store: Store<any> | undefined): void {
    this.config.store = store;
  }

  private newRule(field?: string): Rule {
    const f = this.field(field ?? '');
    return { kind: 'rule', id: this.nextId++, field: f.name, op: OPS[f.type ?? 'text'][0] };
  }

  private changed(): void {
    this.emit('change', this.getFilter());
    if (this.config.live === false) return;
    this.cancelApply?.();
    this.cancelApply = this.later(() => this.apply(), 250);
  }

  // ---- rendering -----------------------------------------------------------------------------

  /** Rebuilds the rows, keeping keyboard focus on the same control. */
  private paint(): void {
    const keep = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-fb]')?.dataset.fb;
    this.parts.splice(0).forEach((p) => p.destroy());
    const kids: HTMLElement[] = [this.group(this.root, 0, null)];
    if (this.config.live === false) kids.push(h('div', 'op-filterbuilder__foot', {}, this.button(t('fbApply'), 'primary', () => this.apply())));
    this.el.replaceChildren(...kids);
    if (this.mounted) this.parts.forEach((p) => p.notifyMount());
    const back = keep && this.el.querySelector<HTMLElement>(`[data-fb="${keep}"]`);
    if (back) (back.matches('select,button,input') ? back : back.querySelector('input'))?.focus();
  }

  private button(text: string, variant: 'default' | 'primary' | 'ghost', handler: () => void, icon?: string): HTMLElement {
    const b = new Button({ text, variant, icon, handler });
    this.parts.push(b);
    return b.el;
  }

  private select(options: Array<[string, string]>, value: string, label: string, key: string, onChange: (v: string) => void): HTMLSelectElement {
    const s = h('select', 'op-filterbuilder__select', { 'aria-label': label, 'data-fb': key });
    for (const [v, text] of options) s.append(h('option', '', { value: v }, text));
    s.value = value;
    this.listen(s, 'change', () => onChange(s.value));
    return s;
  }

  private group(g: Group, depth: number, parent: Group | null): HTMLElement {
    const el = h('div', `op-filterbuilder__group${depth ? ' is-nested' : ''}`, { role: 'group', 'aria-label': t('fbLabel') });
    const logic = this.select([['and', t('fbAnd')], ['or', t('fbOr')]], g.op, t('fbLabel'), `g${depth}:logic`, (v) => {
      g.op = v as 'and' | 'or';
      this.changed();
    });
    const head = h('div', 'op-filterbuilder__head', {}, logic);
    const add = (field?: string) => {
      const r = this.newRule(field);
      g.items.push(r);
      this.paint();
      this.el.querySelector<HTMLElement>(`[data-fb="r${r.id}:v1"] input, select[data-fb="r${r.id}:v1"]`)?.focus();
    };
    const addBtn = this.button(t('fbAddFilter'), 'ghost', () => (this.config.addMode === 'pick' ? this.pick(addBtn, add) : add()), 'plus');
    head.append(addBtn);
    if (depth < (this.config.maxDepth ?? 3)) {
      head.append(
        this.button(t('fbAddGroup'), 'ghost', () => {
          g.items.push({ kind: 'group', op: 'or', items: [this.newRule()] });
          this.paint();
        }, 'plus'),
      );
    }
    if (parent) head.append(this.removeBtn(() => (parent.items.splice(parent.items.indexOf(g), 1), this.paint(), this.changed())));
    else if (g.items.length) head.append(this.button(t('fbClear'), 'ghost', () => this.clear()));
    el.append(head);
    if (!g.items.length && !parent) el.append(h('div', 'op-filterbuilder__none', {}, t('fbNone')));
    for (const it of g.items) el.append(it.kind === 'group' ? this.group(it, depth + 1, g) : this.rule(it, g));
    return el;
  }

  /** "Add filter" in `pick` mode: a menu of the fields; the chosen one gets the new row. */
  private pick(anchor: HTMLElement, add: (field: string) => void): void {
    this.pickMenu ??= new Menu({});
    this.pickMenu.setItems(this.config.fields.map((f) => ({ text: f.label ?? f.name, handler: () => add(f.name) })));
    this.pickMenu.showBy(anchor);
  }

  private removeBtn(onClick: () => void): HTMLElement {
    const b = h('button', 'op-filterbuilder__remove', { type: 'button', 'aria-label': t('fbRemove'), title: t('fbRemove') }, iconEl('x'));
    this.listen(b, 'click', onClick);
    return b;
  }

  private rule(r: Rule, parent: Group): HTMLElement {
    const f = this.field(r.field);
    const type = f.type ?? 'text';
    const k = `r${r.id}`;
    const fieldSel = this.select(this.config.fields.map((x) => [x.name, x.label ?? x.name]), r.field, t('fbField'), `${k}:field`, (v) => {
      r.field = v;
      const ops = OPS[this.field(v).type ?? 'text'];
      if (!ops.includes(r.op) || (this.field(v).type ?? 'text') !== type) r.op = ops[0];
      r.value = r.value2 = undefined;
      this.paint();
      this.changed();
    });
    const opSel = this.select(OPS[type].map((o) => [o, t(KEY[o])]), r.op, t('fbOperator'), `${k}:op`, (v) => {
      const prev = r.op;
      r.op = v as FilterOp;
      if (arity(prev) !== arity(r.op) || isList(prev) !== isList(r.op)) r.value = r.value2 = undefined;
      this.paint();
      this.changed();
    });
    const row = h('div', 'op-filterbuilder__row', {}, fieldSel, opSel);
    const n = arity(r.op);
    if (n >= 1) row.append(this.editor(r, f, 'value', `${k}:v1`));
    if (n === 2) row.append(h('span', 'op-filterbuilder__to', {}, t('fbTo')), this.editor(r, f, 'value2', `${k}:v2`));
    row.append(this.removeBtn(() => (parent.items.splice(parent.items.indexOf(r), 1), this.paint(), this.changed())));
    return row;
  }

  private editor(r: Rule, f: FilterField, slot: 'value' | 'value2', key: string): HTMLElement {
    const type = f.type ?? 'text';
    const label = t('fbValue');
    const set = (v: unknown) => {
      r[slot] = v;
      this.changed();
    };
    if (type === 'select') {
      const opts = (f.options ?? []).map((o): [string, string] => (typeof o === 'object' ? [String(o.value), o.label] : [String(o), String(o)]));
      const raw = (v: string) => (f.options ?? []).map((o) => (typeof o === 'object' ? o.value : o)).find((o) => String(o) === v) ?? v;
      if (isList(r.op)) {
        // "is any of": one toggle chip per option (a native multi-select is tall, scrolls and is easy to mis-click)
        const on = new Set((Array.isArray(r.value) ? r.value : []).map(String));
        const group = h('div', 'op-filterbuilder__chips', { role: 'group', 'aria-label': label, 'data-fb': key });
        for (const [v, text] of opts) {
          const box = h('input', 'op-filterbuilder__chipbox', { type: 'checkbox', value: v });
          box.checked = on.has(v);
          group.append(h('label', 'op-filterbuilder__chip', {}, box, h('span', '', {}, text)));
        }
        this.listen(group, 'change', () => set(Array.from(group.querySelectorAll<HTMLInputElement>('input:checked')).map((i) => raw(i.value))));
        return group;
      }
      const s = h('select', 'op-filterbuilder__select', { 'aria-label': label, 'data-fb': key });
      s.append(h('option', '', { value: '' }, ''));
      for (const [v, text] of opts) s.append(h('option', '', { value: v }, text));
      s.value = r.value != null ? String(r.value) : '';
      this.listen(s, 'change', () => set(s.value === '' ? undefined : raw(s.value)));
      return s;
    }
    if (isList(r.op)) {
      const c = new TextField({ stableSize: false, placeholder: t('fbList'), value: ((r.value as unknown[]) ?? []).join(', ') });
      c.on('change', (v: string) => set(v.split(',').map((x) => x.trim()).filter(Boolean)));
      return this.own1(c, label, key);
    }
    const c = type === 'number' ? new NumberField({ value: r[slot] ?? null, stableSize: false }) : type === 'date' ? new DateField({ value: r[slot] ?? null, stableSize: false }) : new TextField({ value: r[slot] ?? '', stableSize: false });
    c.on('change', (v: unknown) => set(v === '' ? undefined : v));
    return this.own1(c, label, key);
  }

  /** Registers an editor, labels its input, and makes Enter apply. */
  private own1(c: TextField<any, any>, label: string, key: string): HTMLElement {
    this.parts.push(c);
    c.on('enter', () => this.apply());
    const el = c.el;
    el.classList.add('op-filterbuilder__value');
    el.dataset.fb = key;
    c.getInput().setAttribute('aria-label', label);
    return el;
  }
}
register('filterbuilder', FilterBuilder);
