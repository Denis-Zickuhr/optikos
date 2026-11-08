// ERP demo ("NorthBridge"): NavMenu sidebar, tab workspace with breadcrumb, Ctrl+K palette, and list pages with saved views, dynamic filters and bulk actions. Public API only.
import {
  create, register, Component, Tabs, NavMenu, Breadcrumb, CommandPalette, MessageBox, toast, setLocale, registerLookup,
  type Container, type Menu, type Command, type ComponentConfig, type NavItem, type Button, type FilterGroup, type BreadcrumbItem,
} from 'optikos';
import { defs, byId, buildPage, buildRecord, mutate, countRules, type Page, type PageDef } from './pages';
import { orders, invoices, jobs, customers, type Row } from './data';

void registerLookup;
setLocale('en');

// ---- a custom Stat card (an app building its own component with the library's tools) ----------------------------------------------
interface StatConfig extends ComponentConfig { label?: string; value?: string; hint?: string; tone?: 'ok' | 'warn' | 'bad'; onOpen?: () => void }
class Stat extends Component<StatConfig> {
  protected override baseCls = 'erp-stat';
  protected override tag = 'button' as const;
  protected override onRender() {
    const c = this.config;
    this.el.setAttribute('type', 'button');
    this.el.classList.add(`erp-stat--${c.tone ?? 'ok'}`);
    for (const [cls, text] of [['erp-stat__label', c.label], ['erp-stat__value', c.value], ['erp-stat__hint', c.hint]] as const) this.el.append(Object.assign(document.createElement('span'), { className: cls, textContent: text ?? '' }));
    this.listen(this.el, 'click', () => c.onOpen?.());
  }
}
register('erp-stat', Stat);

const css = document.createElement('style');
css.textContent = `html,body{margin:0;height:100%}
.erp-top{flex-wrap:nowrap!important;background:#14213a;color:#eaf0fa;border:0}.erp-top .op-button{color:inherit}.erp-top .op-button:hover:not(:disabled){background:#1d2f52}
.erp-top .erp-brand{white-space:nowrap;color:#fff;font-weight:700;letter-spacing:.04em;padding-inline:var(--op-space-2)}
.erp-search{min-inline-size:18rem;justify-content:flex-start!important;color:#9fb2d3!important;background:#1d2f52!important;border:1px solid #2c4474!important}
.erp-search kbd{margin-inline-start:auto;padding:0 .35rem;border:1px solid #3a5588;border-radius:var(--op-radius-sm);font:inherit;font-size:var(--op-font-size-sm)}
.erp-burger{display:none}.op-layout-border.is-narrow .erp-burger{display:inline-flex}.op-layout-border.is-narrow .erp-search{min-inline-size:0;background:transparent!important;border-color:transparent!important}.op-layout-border.is-narrow .erp-search .op-button__text,.op-layout-border.is-narrow .erp-user .op-button__text{display:none}
.erp-side{display:flex;flex-direction:column;background:var(--op-navmenu-bg);--op-region-drawer-width:18rem;transition:inline-size var(--op-duration) var(--op-easing)}
.erp-side .op-navmenu{flex:1}.erp-sidebar-tools{display:flex;gap:var(--op-space-1);padding:var(--op-space-2);border-block-end:1px solid #22355c}
.erp-side.is-rail .erp-filter{display:none}
.erp-crumbs{padding:var(--op-space-2) var(--op-space-4);background:var(--op-color-surface);border-block-end:1px solid var(--op-color-border)}
.erp-pill{display:inline-block;padding:0 .5rem;border-radius:var(--op-radius-pill);font-size:var(--op-font-size-sm);font-weight:600;line-height:1.5;white-space:nowrap}
.erp-pill--ok{color:var(--op-color-success);background:var(--op-color-success-soft)}.erp-pill--warn{color:var(--op-color-warning);background:var(--op-color-warning-soft)}
.erp-pill--bad{color:var(--op-color-danger);background:var(--op-color-danger-soft)}.erp-pill--info{color:var(--op-color-info);background:var(--op-color-info-soft)}.erp-pill--muted{color:var(--op-color-fg-muted);background:var(--op-color-surface-2)}
.erp-dash{padding:var(--op-space-4);overflow:auto;gap:var(--op-space-4)!important}
.erp-stat{display:flex;flex:1;flex-direction:column;gap:.15rem;padding:var(--op-space-4);font:inherit;text-align:start;color:var(--op-color-fg);background:var(--op-color-surface);border:1px solid var(--op-color-border);border-inline-start-width:4px;border-radius:var(--op-radius);cursor:pointer}
.erp-stat:hover{background:var(--op-color-hover)}.erp-stat:focus-visible{outline:var(--op-focus-width) solid var(--op-color-focus)}
.erp-stat--ok{border-inline-start-color:var(--op-color-success)}.erp-stat--warn{border-inline-start-color:var(--op-color-warning)}.erp-stat--bad{border-inline-start-color:var(--op-color-danger)}
.erp-stat__label{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm);font-weight:600;text-transform:uppercase;letter-spacing:.05em}.erp-stat__value{font-size:1.75rem;font-weight:600;font-variant-numeric:tabular-nums}.erp-stat__hint{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}`;
document.head.append(css);

// ---- workspace: pages and records open as tabs ---------------------------------------------------------------------------------------
const pages = new Map<string, Page>();
const fmtMoney = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
let tabs!: Tabs;
let nav!: NavMenu;
let crumbs!: Breadcrumb;
let shell!: Container;

const ctx = {
  openRecord(def: PageDef, row?: Row) {
    const id = `rec-${def.id}-${row ? row[def.idField] : 'new'}`;
    if (tabs.items.some((t) => t.id === id)) return void tabs.setActive(id);
    const close = () => tabs.closeTab(id);
    tabs.setActive(tabs.add(buildRecord(def, row, (values, original) => {
      if (original) mutate(page(def.id), [original[def.idField]], values);
      else {
        const nextId = Math.max(0, ...def.rows.map((r) => r[def.idField])) + 1;
        def.rows.unshift({ ...values, [def.idField]: nextId });
        page(def.id).reload();
      }
      ctx.changed(def);
      toast({ type: 'success', text: `${def.singular} ${values[def.label] ?? ''} saved` });
      close();
      openPage(def.id);
    }, close)));
  },
  changed(def: PageDef) {
    if (def.badge) nav.updateItem(def.id, { badge: def.badge(def.rows) || '' });
  },
};
const page = (id: string): Page => {
  let p = pages.get(id);
  if (!p) {
    p = buildPage(byId(id), ctx);
    pages.set(id, p);
  }
  return p;
};

function openPage(id: string, filter?: FilterGroup) {
  if (id === 'dashboard') {
    if (!tabs.items.some((t) => t.id === 'page-dashboard')) tabs.add(dashboard());
    return void tabs.setActive('page-dashboard');
  }
  const exists = tabs.items.some((t) => t.id === `page-${id}`);
  const p = page(id);
  if (!exists) tabs.add(p.el);
  tabs.setActive(`page-${id}`);
  if (filter) p.filter(filter);
}

// ---- dashboard -------------------------------------------------------------------------------------------------------------------------------
function dashboard() {
  const billed = orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue');
  const open = orders.filter((o) => o.status === 'draft' || o.status === 'confirmed').length;
  const failed = jobs.filter((j) => j.status === 'failed').length;
  const eq = (field: string, value: unknown) => ({ op: 'and' as const, filters: [{ field, op: 'eq' as const, value }] });
  const recent = [...orders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const late = [...overdue].sort((a, b) => b.amount - a.amount).slice(0, 8);
  return create<Container>({
    type: 'container', id: 'page-dashboard', title: 'Dashboard', icon: 'home', closable: false, layout: { type: 'vbox' }, cls: 'erp-dash',
    items: [
      { type: 'container', layout: { type: 'hbox', gap: 12, stackBelow: 760 }, items: [
        { type: 'erp-stat', label: 'Billed revenue', value: fmtMoney(billed), hint: 'shipped + delivered orders', tone: 'ok', onOpen: () => openPage('orders', { op: 'or', filters: [{ field: 'status', op: 'eq', value: 'shipped' }, { field: 'status', op: 'eq', value: 'delivered' }] }) },
        { type: 'erp-stat', label: 'Open orders', value: String(open), hint: 'draft + confirmed · open the list', tone: 'warn', onOpen: () => openPage('orders', { op: 'or', filters: [{ field: 'status', op: 'eq', value: 'draft' }, { field: 'status', op: 'eq', value: 'confirmed' }] }) },
        { type: 'erp-stat', label: 'Overdue invoices', value: `${overdue.length} · ${fmtMoney(overdue.reduce((s, i) => s + i.amount - i.paid, 0))}`, hint: 'unpaid past due', tone: 'bad', onOpen: () => openPage('invoices', eq('status', 'overdue')) },
        { type: 'erp-stat', label: 'Failed jobs', value: String(failed), hint: 'needs a retry', tone: 'bad', onOpen: () => openPage('jobs', eq('status', 'failed')) },
      ] },
      { type: 'container', layout: { type: 'hbox', gap: 12, stackBelow: 960 }, items: [
        { type: 'panel', title: 'Latest orders', icon: 'list', flex: 1, items: [{ type: 'table', data: recent, striped: true, columns: [{ field: 'number', header: 'Order' }, { field: 'customer' }, { field: 'total', format: 'money', align: 'right' }, { field: 'status' }] }] },
        { type: 'panel', title: 'Largest overdue invoices', icon: 'file', flex: 1, items: [{ type: 'table', data: late, striped: true, columns: [{ field: 'number', header: 'Invoice' }, { field: 'customer' }, { field: 'amount', format: 'money', align: 'right' }, { field: 'due', header: 'Due' }] }] },
      ] },
      { type: 'label', text: `${customers.length} customers · ${orders.length} orders · ${invoices.length} invoices in this demo dataset. Try Ctrl+K, the nav filter, or double-click a row.`, style: 'color:var(--op-color-fg-muted)' },
    ],
  });
}

// ---- navigation -----------------------------------------------------------------------------------------------------------------------------------
const groups = [...new Set(defs.map((d) => d.group))];
const navItems: NavItem[] = [
  { id: 'dashboard', text: 'Dashboard', icon: 'home' },
  ...groups.map((g) => ({
    id: `grp-${g}`, text: g, expanded: g === 'Sales',
    items: defs.filter((d) => d.group === g).map((d) => ({ id: d.id, text: d.title, icon: d.icon, badge: d.badge?.(d.rows) || undefined })),
  })),
];
const groupIcon: Record<string, string> = { Sales: 'chart', Purchasing: 'truck', Inventory: 'box', Operations: 'clock', Administration: 'shield' };
void groupIcon;

function syncChrome(active?: { id: string }) {
  const id = active?.id ?? '';
  const rec = /^rec-([a-z]+)-(.+)$/.exec(id);
  const pageId = rec ? rec[1] : id.replace(/^page-/, '');
  nav.setActive(pageId || undefined);
  const def = defs.find((d) => d.id === pageId);
  const items: BreadcrumbItem[] = [{ text: 'NorthBridge', icon: 'home', handler: () => openPage('dashboard') }];
  if (def) {
    items.push({ text: def.group, handler: () => nav.expand(`grp-${def.group}`) }, { text: def.title, handler: () => openPage(def.id) });
    if (rec) items.push({ text: rec[2] === 'new' ? `New ${def.singular.toLowerCase()}` : String((tabs.getActive()?.config as any).title ?? rec[2]) });
  } else items.push({ text: 'Dashboard' });
  crumbs.setItems(items);
  document.title = `${active ? String((active as any).config?.title ?? '') + ' · ' : ''}NorthBridge ERP`;
}

// ---- palette ------------------------------------------------------------------------------------------------------------------------------------------
// the rail (icons only) is a desktop preference: a phone's drawer always shows the names
let railPref = false;
const applyRail = () => {
  const rail = railPref && !shell.layout?.isNarrow?.();
  nav.setCollapsed(rail);
  side.el.classList.toggle('is-rail', rail);
  side.el.style.inlineSize = rail ? 'var(--op-navmenu-rail-width)' : '';
};
const toggleRail = () => {
  if (shell.layout?.isNarrow?.()) return void shell.layout.closeRegion?.('west');
  railPref = !railPref;
  applyRail();
};
const commands: Command[] = [
  { id: 'go-dashboard', title: 'Go to Dashboard', category: 'Navigate', icon: 'home', handler: () => openPage('dashboard') },
  ...defs.map((d): Command => ({ id: `go-${d.id}`, title: `Go to ${d.title}`, category: 'Navigate', icon: d.icon, description: d.group, keywords: [d.singular, d.group], handler: () => openPage(d.id) })),
  ...defs.map((d): Command => ({ id: `new-${d.id}`, title: `New ${d.singular.toLowerCase()}`, category: 'Create', icon: 'plus', keywords: ['add', 'create', d.group], handler: () => ctx.openRecord(d) })),
  { id: 'open-overdue', title: 'Overdue invoices', category: 'Shortcuts', icon: 'alert', description: 'Opens Invoices filtered by status = overdue', handler: () => openPage('invoices', { op: 'and', filters: [{ field: 'status', op: 'eq', value: 'overdue' }] }) },
  { id: 'open-failed', title: 'Failed jobs', category: 'Shortcuts', icon: 'alert', description: 'Opens Jobs filtered by status = failed', handler: () => openPage('jobs', { op: 'and', filters: [{ field: 'status', op: 'eq', value: 'failed' }] }) },
  { id: 'rail', title: 'Collapse / expand the sidebar', category: 'View', icon: 'menu', shortcut: 'rail', handler: toggleRail },
  { id: 'close-tab', title: 'Close current tab', category: 'View', icon: 'x', hidden: () => tabs.getActive()?.id === 'page-dashboard', handler: () => tabs.closeTab(tabs.getActive()!) },
  { id: 'close-others', title: 'Close all other tabs', category: 'View', icon: 'x', handler: () => { const keep = tabs.getActive(); for (const t of [...tabs.items]) if (t !== keep && (t.config as any).closable !== false) tabs.closeTab(t); } },
];
const palette = create<CommandPalette>({ type: 'commandpalette', commands, categories: ['Navigate', 'Create', 'Shortcuts', 'View'], placeholder: 'Jump to a page, create a record, open a shortcut…' });

// ---- shell --------------------------------------------------------------------------------------------------------------------------------------------------
nav = create<NavMenu>({ type: 'navmenu', items: navItems, active: 'dashboard', ariaLabel: 'Main navigation', flex: 1 });
nav.on('select', (item: NavItem) => openPage(item.id));
const navFilter = create({ type: 'textfield', placeholder: 'Filter menu…', clearable: true, stableSize: false, cls: 'erp-filter', style: 'flex:1', listeners: { change: (v: string) => nav.filter(v ?? '') } } as any);
const side = create<Container>({
  type: 'container', region: 'west', width: 280, cls: 'erp-side', layout: { type: 'vbox', gap: 0 },
  items: [{ type: 'container', cls: 'erp-sidebar-tools', layout: { type: 'hbox', gap: 4 }, items: [navFilter, { type: 'button', icon: 'menu', variant: 'ghost', ariaLabel: 'Collapse sidebar', tooltip: 'Collapse / expand sidebar', style: 'color:#d5ddeb', handler: toggleRail }] }, nav],
});
const userMenu = create<Menu>({ type: 'menu', items: [
  { text: 'My profile', icon: 'user', handler: () => ctx.openRecord(byId('users'), byId('users').rows[0]) },
  { text: 'Keyboard shortcuts', icon: 'info', handler: () => void MessageBox.alert('Ctrl/⌘ + K — command palette\nAlt + ←/→ — move a column (focused header)\nDelete — close the focused tab\n↑↓←→ — navigate the sidebar tree', { title: 'Shortcuts' }) },
  '-', { text: 'Sign out', handler: () => toast({ type: 'warning', text: 'Signed out (demo)' }) },
] });
crumbs = create<Breadcrumb>({ type: 'breadcrumb', items: [{ text: 'NorthBridge' }], cls: 'erp-crumbs' });
tabs = create<Tabs>({ type: 'tabs', flex: 1, closable: true, items: [dashboard()] });
tabs.on('change', (t: any) => syncChrome(t));
tabs.on('close', () => syncChrome(tabs.getActive()));

create({
  type: 'viewport', renderTo: document.body,
  items: [(shell = create<Container>({
    type: 'container', layout: { type: 'border', narrowBelow: 860 }, items: [
      { type: 'toolbar', region: 'north', cls: 'erp-top', items: [
        { type: 'button', icon: 'menu', variant: 'ghost', cls: 'erp-burger', ariaLabel: 'Menu', handler: () => shell.layout?.toggleRegion?.('west') },
        { type: 'label', text: 'NorthBridge ERP', cls: 'erp-brand' },
        { type: 'button', icon: 'search', cls: 'erp-search', variant: 'ghost', ariaLabel: 'Search or jump to', handler: () => palette.open(), text: 'Search or jump to…' },
        '->',
        { type: 'button', icon: 'bell', variant: 'ghost', ariaLabel: 'Notifications', handler: () => toast({ type: 'info', title: 'Notifications', text: `${jobs.filter((j) => j.status === 'failed').length} failed jobs and ${invoices.filter((i) => i.status === 'overdue').length} overdue invoices need attention` }) },
        { type: 'button', text: 'Ada Lovelace', icon: 'user', variant: 'ghost', cls: 'erp-user', ariaLabel: 'Account', handler: (b: Button) => userMenu.showBy(b) },
      ] },
      side,
      { type: 'container', region: 'center', layout: { type: 'vbox', gap: 0 }, items: [crumbs, tabs] },
    ],
  }) as Container)],
});
shell.on('narrow-change', applyRail);
// choosing a page on a phone closes the drawer
nav.on('select', () => shell.layout?.closeRegion?.('west'));
syncChrome(tabs.getActive());
void countRules;
