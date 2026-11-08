// Page definitions and the generic "list page" builder of the ERP demo: one definition → toolbar, saved views,
// dynamic filters, grid with bulk/row actions, and a record form. Public API only.
import {
  create, Store, matchFilter, registerLookup, MessageBox, toast, localViewStorage,
  type Grid, type Form, type FilterBuilder, type FilterGroup, type FilterNode, type Container, type Button, type Model, type Column, type FilterField,
} from 'optikos';
import { customers, suppliers, products, orders, invoices, purchases, users, jobs, ownerNames, type Row } from './data';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'muted';
export interface Col {
  field: string;
  header: string;
  type?: 'text' | 'number' | 'money' | 'date' | 'select' | 'bool';
  options?: string[];
  tone?: Record<string, Tone>;
  width?: number;
  /** Not editable in the record form (ids, computed). */
  readonly?: boolean;
  required?: boolean;
  /** Pick the value from another dataset with a lookup window. */
  lookup?: 'customers' | 'suppliers' | 'owners';
  /** Leave out of the record form. */
  noForm?: boolean;
  /** Group label (band over the header, section in the column menu). Default derived from the type. */
  group?: string;
}
export interface PageDef {
  id: string;
  title: string;
  singular: string;
  icon: string;
  group: string;
  rows: Row[];
  idField: string;
  /** Column shown in the record tab's title and breadcrumb. */
  label: string;
  cols: Col[];
  remote?: boolean;
  /** Bulk actions: `patch` is applied to every selected record. */
  bulk?: Array<{ text: string; icon?: string; patch: Row; danger?: boolean }>;
  /** Number shown on the nav item. */
  badge?: (rows: Row[]) => number;
  defaults?: () => Row;
}

const STATUS: Record<string, Tone> = {
  active: 'ok', paid: 'ok', done: 'ok', delivered: 'ok', approved: 'ok', received: 'ok', 'in stock': 'ok',
  open: 'info', confirmed: 'info', running: 'info', ordered: 'info', shipped: 'info', requested: 'info', invited: 'info', queued: 'muted', draft: 'muted', pending: 'warn',
  hold: 'warn', low: 'warn', overdue: 'bad', failed: 'bad', locked: 'bad', blocked: 'bad', cancelled: 'muted', void: 'muted', inactive: 'muted', 'out of stock': 'bad',
};

export const defs: PageDef[] = [
  { id: 'orders', title: 'Sales orders', singular: 'Sales order', icon: 'list', group: 'Sales', rows: orders, idField: 'id', label: 'number', remote: true,
    badge: (r) => r.filter((x) => x.status === 'draft').length, defaults: () => ({ number: `SO-${1000 + orders.length}`, status: 'draft', date: '2026-11-08', items: 1, total: 0, channel: 'Web', owner: 'Ada Lovelace' }),
    bulk: [{ text: 'Confirm', icon: 'check', patch: { status: 'confirmed' } }, { text: 'Cancel orders', patch: { status: 'cancelled' }, danger: true }],
    cols: [
      { field: 'number', header: 'Order', readonly: true, width: 110 }, { field: 'customer', header: 'Customer', lookup: 'customers', required: true, width: 230 },
      { field: 'date', header: 'Date', type: 'date', width: 120 }, { field: 'due', header: 'Due', type: 'date', width: 120 }, { field: 'items', header: 'Lines', type: 'number', width: 80 },
      { field: 'total', header: 'Total', type: 'money', width: 120 }, { field: 'status', header: 'Status', type: 'select', options: ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled'], width: 120 },
      { field: 'channel', header: 'Channel', type: 'select', options: ['Web', 'EDI', 'Sales rep', 'Phone'], width: 110 }, { field: 'owner', header: 'Owner', lookup: 'owners', width: 170 },
    ] },
  { id: 'invoices', title: 'Invoices', singular: 'Invoice', icon: 'file', group: 'Sales', rows: invoices, idField: 'id', label: 'number',
    badge: (r) => r.filter((x) => x.status === 'overdue').length, defaults: () => ({ number: `INV-${20000 + invoices.length}`, status: 'open', issued: '2026-11-08', due: '2026-12-08', amount: 0, paid: 0, currency: 'USD' }),
    bulk: [{ text: 'Mark paid', icon: 'check', patch: { status: 'paid' } }, { text: 'Void', patch: { status: 'void' }, danger: true }],
    cols: [
      { field: 'number', header: 'Invoice', readonly: true, width: 120 }, { field: 'order', header: 'Order', width: 110 }, { field: 'customer', header: 'Customer', lookup: 'customers', required: true, width: 230 },
      { field: 'issued', header: 'Issued', type: 'date', width: 120 }, { field: 'due', header: 'Due', type: 'date', width: 120 }, { field: 'amount', header: 'Amount', type: 'money', width: 120 },
      { field: 'paid', header: 'Paid', type: 'money', width: 110 }, { field: 'currency', header: 'Cur.', type: 'select', options: ['USD', 'EUR', 'BRL'], width: 80 },
      { field: 'status', header: 'Status', type: 'select', options: ['open', 'paid', 'overdue', 'void'], width: 110 },
    ] },
  { id: 'customers', title: 'Customers', singular: 'Customer', icon: 'users', group: 'Sales', rows: customers, idField: 'id', label: 'name',
    defaults: () => ({ code: `C-${String(customers.length + 1).padStart(4, '0')}`, status: 'active', segment: 'Retail', creditLimit: 10000, balance: 0, since: '2026-11-08', owner: 'Ada Lovelace' }),
    bulk: [{ text: 'Put on hold', patch: { status: 'hold' } }, { text: 'Activate', icon: 'check', patch: { status: 'active' } }],
    cols: [
      { field: 'code', header: 'Code', readonly: true, width: 90 }, { field: 'name', header: 'Name', required: true }, { field: 'segment', header: 'Segment', type: 'select', options: ['Enterprise', 'Retail', 'Government', 'Startup'], width: 120 },
      { field: 'city', header: 'City' }, { field: 'country', header: 'Ctry', width: 70 }, { field: 'creditLimit', header: 'Credit limit', type: 'money', width: 120 }, { field: 'balance', header: 'Balance', type: 'money', width: 110 },
      { field: 'status', header: 'Status', type: 'select', options: ['active', 'hold', 'inactive'], width: 100 }, { field: 'since', header: 'Customer since', type: 'date', width: 130 }, { field: 'owner', header: 'Account owner', lookup: 'owners' },
    ] },
  { id: 'purchases', title: 'Purchase orders', singular: 'Purchase order', icon: 'truck', group: 'Purchasing', rows: purchases, idField: 'id', label: 'number',
    badge: (r) => r.filter((x) => x.status === 'requested').length, defaults: () => ({ number: `PO-${5000 + purchases.length}`, status: 'requested', date: '2026-11-08', expected: '2026-11-30', total: 0, buyer: 'Ada Lovelace' }),
    bulk: [{ text: 'Approve', icon: 'check', patch: { status: 'approved' } }, { text: 'Cancel', patch: { status: 'cancelled' }, danger: true }],
    cols: [
      { field: 'number', header: 'PO', readonly: true, width: 110 }, { field: 'supplier', header: 'Supplier', lookup: 'suppliers', required: true }, { field: 'date', header: 'Date', type: 'date', width: 120 },
      { field: 'expected', header: 'Expected', type: 'date', width: 120 }, { field: 'total', header: 'Total', type: 'money', width: 120 },
      { field: 'status', header: 'Status', type: 'select', options: ['requested', 'approved', 'ordered', 'received', 'cancelled'], width: 120 }, { field: 'buyer', header: 'Buyer', lookup: 'owners' },
    ] },
  { id: 'suppliers', title: 'Suppliers', singular: 'Supplier', icon: 'user', group: 'Purchasing', rows: suppliers, idField: 'id', label: 'name',
    defaults: () => ({ code: `S-${String(suppliers.length + 1).padStart(3, '0')}`, status: 'pending', rating: 3, terms: 'Net 30', category: 'Services' }),
    bulk: [{ text: 'Approve', icon: 'check', patch: { status: 'approved' } }, { text: 'Block', patch: { status: 'blocked' }, danger: true }],
    cols: [
      { field: 'code', header: 'Code', readonly: true, width: 90 }, { field: 'name', header: 'Name', required: true }, { field: 'category', header: 'Category', type: 'select', options: ['Raw materials', 'Packaging', 'Freight', 'Services', 'Equipment'] },
      { field: 'country', header: 'Country', width: 90 }, { field: 'rating', header: 'Rating', type: 'number', width: 90 }, { field: 'terms', header: 'Terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 45', 'Net 60'], width: 100 },
      { field: 'status', header: 'Status', type: 'select', options: ['approved', 'pending', 'blocked'], width: 110 },
    ] },
  { id: 'products', title: 'Products', singular: 'Product', icon: 'box', group: 'Inventory', rows: products, idField: 'id', label: 'sku',
    badge: (r) => r.filter((x) => x.status === 'out of stock').length, defaults: () => ({ sku: `SKU-${String(products.length + 1).padStart(5, '0')}`, status: 'in stock', category: 'Hardware', price: 0, cost: 0, stock: 0, reorder: 50 }),
    cols: [
      { field: 'sku', header: 'SKU', readonly: true, width: 110 }, { field: 'name', header: 'Name', required: true }, { field: 'category', header: 'Category', type: 'select', options: ['Hardware', 'Electronics', 'Consumables', 'Packaging', 'Spare parts'] },
      { field: 'price', header: 'Price', type: 'money', width: 100 }, { field: 'cost', header: 'Cost', type: 'money', width: 100 }, { field: 'stock', header: 'Stock', type: 'number', width: 90 },
      { field: 'reorder', header: 'Reorder at', type: 'number', width: 100 }, { field: 'status', header: 'Availability', type: 'select', options: ['in stock', 'low', 'out of stock'], width: 120, readonly: true },
    ] },
  { id: 'jobs', title: 'Background jobs', singular: 'Job', icon: 'clock', group: 'Operations', rows: jobs, idField: 'id', label: 'name', remote: true,
    badge: (r) => r.filter((x) => x.status === 'failed').length, defaults: () => ({ name: 'Nightly invoicing', queue: 'default', status: 'queued', attempts: 0, duration: 0, owner: 'system', started: '2026-11-08 00:00' }),
    bulk: [{ text: 'Retry', icon: 'check', patch: { status: 'queued', attempts: 1 } }, { text: 'Cancel', patch: { status: 'cancelled' }, danger: true }],
    cols: [
      { field: 'id', header: '#', type: 'number', readonly: true, width: 70, noForm: true }, { field: 'name', header: 'Job', required: true }, { field: 'queue', header: 'Queue', type: 'select', options: ['default', 'finance', 'integrations', 'maintenance'], width: 130 },
      { field: 'status', header: 'Status', type: 'select', options: ['queued', 'running', 'done', 'failed', 'cancelled'], width: 110 }, { field: 'started', header: 'Started', width: 150 },
      { field: 'duration', header: 'Seconds', type: 'number', width: 90 }, { field: 'attempts', header: 'Attempts', type: 'number', width: 90 }, { field: 'owner', header: 'Triggered by' },
    ] },
  { id: 'users', title: 'Users', singular: 'User', icon: 'shield', group: 'Administration', rows: users, idField: 'id', label: 'name',
    defaults: () => ({ role: 'Viewer', department: 'Operations', status: 'invited', mfa: false, lastLogin: '' }),
    bulk: [{ text: 'Lock', patch: { status: 'locked' }, danger: true }, { text: 'Unlock', icon: 'check', patch: { status: 'active' } }],
    cols: [
      { field: 'id', header: '#', type: 'number', readonly: true, width: 70, noForm: true }, { field: 'name', header: 'Name', required: true }, { field: 'email', header: 'Email', required: true },
      { field: 'role', header: 'Role', type: 'select', options: ['Admin', 'Manager', 'Analyst', 'Viewer'], width: 110 }, { field: 'department', header: 'Department', type: 'select', options: ['Finance', 'Sales', 'Purchasing', 'Operations', 'IT', 'Warehouse'], width: 130 },
      { field: 'status', header: 'Status', type: 'select', options: ['active', 'locked', 'invited'], width: 100 }, { field: 'mfa', header: 'MFA', type: 'bool', width: 70 }, { field: 'lastLogin', header: 'Last login', type: 'date', width: 120 },
    ] },
];
export const byId = (id: string) => defs.find((d) => d.id === id)!;

// ---- lookups: "pick a customer / supplier / owner" opens a search window with filters and a grid ----------------
const lookupBase = (rows: () => Row[], cols: Column[], filters: any[], title: string) => ({
  store: () => new Store<any>({ data: rows(), pageSize: 8 }), columns: cols, filters, valueField: 'name', displayField: 'name', title, width: 760,
});
registerLookup('customers', lookupBase(() => customers, [{ field: 'code', header: 'Code', width: 90 }, { field: 'name', header: 'Name' }, { field: 'segment', header: 'Segment', width: 110 }, { field: 'city', header: 'City' }],
  [{ type: 'textfield', name: 'name', placeholder: 'Name…' }, { type: 'select', name: 'segment', placeholder: 'Any segment', options: ['Enterprise', 'Retail', 'Government', 'Startup'] }], 'Find a customer'));
registerLookup('suppliers', lookupBase(() => suppliers, [{ field: 'code', header: 'Code', width: 90 }, { field: 'name', header: 'Name' }, { field: 'category', header: 'Category' }, { field: 'country', header: 'Country', width: 90 }],
  [{ type: 'textfield', name: 'name', placeholder: 'Name…' }, { type: 'select', name: 'category', placeholder: 'Any category', options: ['Raw materials', 'Packaging', 'Freight', 'Services', 'Equipment'] }], 'Find a supplier'));
registerLookup('owners', lookupBase(() => [...new Set(ownerNames)].map((name, id) => ({ id, name })), [{ field: 'name', header: 'Name' }], [{ type: 'textfield', name: 'name', placeholder: 'Name…' }], 'Find a person'));

// ---- helpers ----------------------------------------------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pill = (v: string, tone: Record<string, Tone> | undefined) => Object.assign(document.createElement('span'), { className: `erp-pill erp-pill--${(tone ?? STATUS)[v] ?? 'muted'}`, textContent: v });

/** Columns are grouped by what they are, so the column menu can switch a whole kind on or off. */
const groupOf = (c: Col) => c.group ?? (c.type === 'money' || c.type === 'number' ? 'Values' : c.type === 'date' ? 'Dates' : c.type === 'select' || c.type === 'bool' ? 'Status' : c.lookup ? 'People' : 'Identification');

const toColumn = (c: Col): Column => {
  const base: Column = { field: c.field, header: c.header, sortable: true, width: c.width, group: groupOf(c) };
  if (c.type === 'money') return { ...base, format: 'money', align: 'right' };
  if (c.type === 'number') return { ...base, align: 'right' };
  if (c.type === 'date') return { ...base, format: (v: any) => (v ? String(v) : '') };
  if (c.type === 'bool') return { ...base, format: 'bool', align: 'center' };
  if (c.type === 'select') return { ...base, renderer: (v: string) => pill(v, c.tone) };
  return base;
};
const toFilterField = (c: Col): FilterField => ({
  name: c.field, label: c.header,
  type: c.type === 'money' || c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : c.type === 'select' ? 'select' : c.type === 'bool' ? 'select' : 'text',
  options: c.type === 'select' ? c.options : c.type === 'bool' ? ([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as any) : undefined,
});
export const countRules = (n: FilterNode | null | undefined): number => (!n ? 0 : 'filters' in n ? n.filters.reduce((s, f) => s + countRules(f), 0) : 1);

export interface PageCtx {
  openRecord(def: PageDef, row?: Row): void;
  changed(def: PageDef): void;
}
export interface Page {
  def: PageDef;
  el: Container;
  grid: Grid;
  filters: FilterBuilder;
  store: Store<any>;
  /** Replaces the filter and shows the bar (deep links from the dashboard). */
  filter(f: FilterGroup | null): void;
  reload(): void;
}

/** Writes through to the source rows, then refreshes the store (a remote store reloads, a local one reloads its data). */
export function mutate(page: Page, ids: unknown[], patch: Row) {
  for (const r of page.def.rows) if (ids.includes(r[page.def.idField])) Object.assign(r, patch);
  page.reload();
}
export function removeRows(page: Page, ids: unknown[]) {
  const keep = page.def.rows.filter((r) => !ids.includes(r[page.def.idField]));
  page.def.rows.splice(0, page.def.rows.length, ...keep);
  page.reload();
}

export function buildPage(def: PageDef, ctx: PageCtx): Page {
  const proxy = (params: any) =>
    sleep(220).then(() => {
      let rows = [...def.rows];
      for (const f of params.filters ?? []) rows = rows.filter((r) => matchFilter(f, r));
      const s = params.sorters?.[0];
      if (s) rows.sort((a, b) => ((a[s.field] ?? '') > (b[s.field] ?? '') ? 1 : (a[s.field] ?? '') < (b[s.field] ?? '') ? -1 : 0) * (s.dir === 'asc' ? 1 : -1));
      const size = params.pageSize ?? 25;
      const start = ((params.page ?? 1) - 1) * size;
      return { data: rows.slice(start, start + size), total: rows.length };
    });
  const store = new Store<any>(def.remote ? { remote: true, pageSize: 25, proxy, autoLoad: true } : { data: [...def.rows], pageSize: 25 });
  const page = { def, store } as Page;
  page.reload = () => (def.remote ? void store.load() : store.loadData([...def.rows]));

  const del = async (recs: Model[]) => {
    const what = recs.length === 1 ? `${def.singular.toLowerCase()} ${recs[0].get(def.label)}` : `${recs.length} ${def.title.toLowerCase()}`;
    if (!(await MessageBox.confirm(`Delete ${what}? This cannot be undone.`, { danger: true, okText: 'Delete', title: `Delete ${def.title.toLowerCase()}` }))) return;
    removeRows(page, recs.map((r) => r.get(def.idField)));
    ctx.changed(def);
    toast({ text: `${recs.length} deleted` });
  };
  const patchSelected = (recs: Model[], patch: Row, text: string) => {
    mutate(page, recs.map((r) => r.get(def.idField)), patch);
    ctx.changed(def);
    toast({ type: 'success', text: `${recs.length} ${def.title.toLowerCase()}: ${text}` });
  };

  const filters = create<FilterBuilder>({ type: 'filterbuilder', store, addMode: 'pick', fields: def.cols.map(toFilterField), hidden: true, style: 'padding:var(--op-space-3);border-bottom:1px solid var(--op-color-border);background:var(--op-color-surface)' });
  const grid = create<Grid>({
    type: 'grid', store, paging: true, flex: 1, ariaLabel: def.title, striped: true,
    checkboxSelection: true, columnMenu: true, reorderableColumns: true, resizableColumns: true, rowActionsMode: 'visible',
    columns: def.cols.map(toColumn),
    bulkActions: [
      ...(def.bulk ?? []).map((b) => ({ text: b.text, icon: b.icon, variant: b.danger ? ('danger' as const) : ('default' as const), handler: (recs: Model[]) => patchSelected(recs, b.patch, b.text.toLowerCase()) })),
      { text: 'Delete', icon: 'trash', variant: 'danger', handler: (recs: Model[]) => void del(recs) },
    ],
    rowActions: [
      { text: `Open ${def.singular.toLowerCase()}`, icon: 'edit', handler: (rec: Model) => ctx.openRecord(def, rec.data as Row) },
      { text: 'Delete', icon: 'trash', variant: 'danger', handler: (rec: Model) => void del([rec]) },
    ],
    listeners: { 'row-dblclick': (rec: Model) => ctx.openRecord(def, rec.data as Row), 'row-activate': (rec: Model) => ctx.openRecord(def, rec.data as Row) },
  });
  let filtersBtn!: Button;
  const showFilters = (on: boolean) => {
    filters.config.hidden = !on;
    on ? filters.show() : filters.hide();
    filtersBtn?.el.setAttribute('aria-pressed', String(on));
  };
  filters.on('apply', (f: FilterGroup | null) => filtersBtn?.setText(countRules(f) ? `Filters (${countRules(f)})` : 'Filters'));

  const el = create<Container>({
    type: 'container', id: `page-${def.id}`, title: def.title, icon: def.icon, closable: true, layout: { type: 'vbox', gap: 0 },
    items: [
      { type: 'toolbar', items: [
        { type: 'viewmanager', grid, filters, storage: localViewStorage(`erp.demo.views.${def.id}`), extra: { filtersOpen: { get: () => !filters.config.hidden, set: (v: unknown) => showFilters(!!v) } } },
        (filtersBtn = create<Button>({ type: 'button', text: 'Filters', icon: 'filter', variant: 'ghost', handler: () => showFilters(!!filters.config.hidden) })) as any,
        '->',
        { type: 'button', text: 'Refresh', icon: 'search', variant: 'ghost', handler: () => (page.reload(), toast({ text: `${def.title} refreshed` })) },
        { type: 'button', text: 'Export', icon: 'file', variant: 'ghost', handler: () => toast({ type: 'info', title: 'Export queued', text: `${def.title} → CSV (demo)` }) },
        { type: 'button', text: `New ${def.singular.toLowerCase()}`, icon: 'plus', variant: 'primary', handler: () => ctx.openRecord(def) },
      ] },
      filters, grid,
    ],
  });
  Object.assign(page, { el, grid, filters, filter: (f: FilterGroup | null) => { filters.setFilter(f); filters.apply(); showFilters(true); } });
  return page;
}

// ---- record form (a tab of its own) -------------------------------------------------------------------------------
const fieldFor = (c: Col): Record<string, any> => {
  const common = { name: c.field, label: c.header, required: c.required, readonly: c.readonly || undefined };
  if (c.lookup) return { type: 'lookupfield', lookup: c.lookup, name: c.field, label: c.header, required: c.required, forceSelection: false };
  if (c.type === 'select') return { type: 'select', options: c.options, ...common };
  if (c.type === 'bool') return { type: 'checkbox', name: c.field, boxLabel: c.header };
  if (c.type === 'date') return { type: 'datefield', ...common };
  if (c.type === 'money') return { type: 'numberfield', decimals: 2, min: 0, ...common };
  if (c.type === 'number') return { type: 'numberfield', ...common };
  return { type: 'textfield', ...common };
};

export function buildRecord(def: PageDef, row: Row | undefined, onSave: (values: Row, row?: Row) => void, onClose: () => void): Container {
  const existing = !!row;
  const base = row ?? def.defaults?.() ?? {};
  const form = create<Form>({
    type: 'form', flex: 1, style: 'padding:var(--op-space-4);overflow:auto',
    items: [{ type: 'container', layout: { type: 'grid', columns: 2, gap: 12 }, items: def.cols.filter((c) => !c.noForm).map((c) => fieldFor(c)) }],
  });
  form.load(base);
  const save = () => {
    if (!form.validate()) return toast({ type: 'warning', text: 'Fix the highlighted fields first' });
    onSave({ ...base, ...form.getValues() }, row);
  };
  const el = create<Container>({
    type: 'container', id: `rec-${def.id}-${row ? row[def.idField] : 'new'}`, title: row ? String(row[def.label]) : `New ${def.singular.toLowerCase()}`, icon: def.icon, closable: true, layout: { type: 'vbox', gap: 0 },
    items: [
      { type: 'toolbar', items: [
        { type: 'button', text: 'Save', icon: 'check', variant: 'primary', handler: save },
        { type: 'button', text: 'Close', variant: 'ghost', handler: onClose },
        '->',
        { type: 'label', text: existing ? `${def.singular} · ${base[def.label]}` : `New ${def.singular.toLowerCase()}`, style: 'color:var(--op-color-fg-muted)' },
      ] },
      form,
    ],
  });
  return el;
}
