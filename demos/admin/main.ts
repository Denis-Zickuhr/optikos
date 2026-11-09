// Admin dashboard demo: Viewport with border layout, sidebar, Tabs, Toasts, dark theme. Public API only.
import { create, Component, type Container, Store, Tabs, Menu, toast, setTheme, register, registerLookup, type ComponentConfig, type Button, type Model } from 'optikos';

/** A custom stat card: shows how an app builds its own component with the same tools the library uses. */
interface StatConfig extends ComponentConfig { label?: string; value?: string; delta?: string }
class Stat extends Component<StatConfig> {
  protected override baseCls = 'adm-stat';
  protected override onRender() {
    const c = this.config;
    this.el.innerHTML = '';
    for (const [cls, text] of [['adm-stat__label', c.label], ['adm-stat__value', c.value], ['adm-stat__delta', c.delta]] as const) {
      const d = document.createElement('div');
      d.className = cls;
      d.textContent = text ?? '';
      this.el.append(d);
    }
  }
  setValue(value: string) {
    this.config.value = value;
    if (this.rendered) this.el.querySelector('.adm-stat__value')!.textContent = value;
  }
}
register('stat', Stat);

const cities = ['Lisboa', 'Porto', 'Madrid', 'Berlin', 'São Paulo', 'Curitiba', 'Florianópolis', 'Porto Alegre'];
const searchCity = (text: string) => new Promise<{ value: string; label: string }[]>((res) => setTimeout(() => res(cities.filter((c) => c.toLowerCase().includes(text.toLowerCase())).map((c) => ({ value: c, label: c }))), 250));

const managers = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `${['Ada', 'Grace', 'Linus', 'Alan', 'Margaret'][i % 5]} ${['Lovelace', 'Hopper', 'Torvalds', 'Turing', 'Hamilton'][(i * 3) % 5]} ${i + 1}`, city: cities[i % cities.length] }));
registerLookup('managers', {
  store: () => new Store({ data: managers, pageSize: 8 }),
  columns: [{ field: 'id', header: '#', width: 64 }, { field: 'name', header: 'Name', minWidth: 180 }, { field: 'city', header: 'City' }],
  filters: [{ type: 'textfield', name: 'name', placeholder: 'Name…' }],
  valueField: 'id', displayField: 'name', title: 'Find a manager',
});

const css = document.createElement('style');
css.textContent = `.adm-stat{padding:var(--op-space-4);background:var(--op-color-surface);border:1px solid var(--op-color-border);border-radius:var(--op-radius)}
.adm-stat__label{color:var(--op-color-fg-muted)}.adm-stat__value{font-size:1.75rem;font-weight:600}.adm-stat__delta{color:var(--op-color-success);font-size:var(--op-font-size-sm)}
.adm-brand{font-weight:600;font-size:var(--op-font-size-lg);padding-inline:var(--op-space-2)}.adm-nav{padding:var(--op-space-2);background:var(--op-color-surface);border-inline-end:1px solid var(--op-color-border)}`;
document.head.append(css);

const orders = new Store({
  pageSize: 12,
  data: Array.from({ length: 80 }, (_, i) => ({ id: 1000 + i, customer: ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli'][i % 5], total: ((i * 7919) % 90000) / 100 + 20, status: ['paid', 'pending', 'refunded'][i % 3], date: `2026-${String((i % 11) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}` })),
});

let dark = false;
const tabs: Tabs = create<Tabs>({
  type: 'tabs', region: 'center',
  items: [
    { title: 'Overview', icon: 'chart', layout: { type: 'vbox', gap: 16 }, style: 'padding:16px', items: [
      { type: 'container', layout: { type: 'grid', columns: 4, gap: 16 }, items: [
        { type: 'stat', label: 'Revenue', value: '$48,210', delta: '▲ 12.4%' }, { type: 'stat', label: 'Orders', value: '1,284', delta: '▲ 3.1%' },
        { type: 'stat', label: 'Customers', value: '842', delta: '▲ 5.6%' }, { type: 'stat', label: 'Refunds', value: '17', delta: '▼ 1.2%' },
      ] },
      { type: 'panel', title: 'Latest orders', flex: 1, items: [{ type: 'table', data: orders.getData().slice(0, 6), columns: [{ field: 'id', header: 'Order' }, { field: 'customer' }, { field: 'total', format: 'money', align: 'right' }, { field: 'status' }], striped: true }] },
    ] },
    { title: 'Orders', icon: 'menu', layout: 'fit', items: [{ type: 'grid', store: orders, paging: true, checkboxSelection: true, columnMenu: true, bulkActions: [{ text: 'Mark shipped', icon: 'check', handler: (recs: Model[]) => toast({ type: 'success', text: `${recs.length} order(s) marked as shipped` }) }], columns: [
      { field: 'id', header: 'Order', width: 100, sortable: true }, { field: 'customer', sortable: true }, { field: 'total', format: 'money', align: 'right', sortable: true }, { field: 'status', sortable: true }, { field: 'date', format: 'date', sortable: true },
    ] }] },
    { title: 'Settings', icon: 'settings', style: 'padding:16px', items: [{ type: 'form', width: 420, items: [
      { type: 'fieldset', title: 'Profile', items: [{ type: 'textfield', name: 'name', label: 'Display name', value: 'Ada Lovelace' }, { type: 'textfield', name: 'email', label: 'Email', value: 'ada@example.com' }, { type: 'suggestfield', name: 'city', label: 'City', query: searchCity, forceSelection: false }, { type: 'lookupfield', name: 'manager', label: 'Manager', lookup: 'managers' }] },
      { type: 'fieldset', title: 'Reporting', items: [{ type: 'daterangefield', name: 'period', label: 'Default report period', value: { start: '2026-11-01', end: '2026-11-30' } }] },
      { type: 'fieldset', title: 'Notifications', items: [{ type: 'checkbox', name: 'mail', boxLabel: 'Email me about new orders', value: true }, { type: 'checkbox', name: 'push', boxLabel: 'Push notifications' }] },
      { type: 'button', text: 'Save settings', variant: 'primary', handler: () => toast({ type: 'success', text: 'Settings saved' }) },
    ] }] },
  ],
});

const nav = (text: string, icon: string, tab: number) => ({ type: 'button', text, icon, variant: 'ghost', handler: () => (tabs.setActive(tab), shell.layout?.closeRegion?.('west')), style: 'justify-content:flex-start' });
let shell: Container;
const userMenu = create<Menu>({ type: 'menu', items: [{ text: 'Profile', icon: 'user', handler: () => tabs.setActive(2) }, { text: 'Notifications', icon: 'bell', handler: () => toast({ text: 'No new notifications' }) }, '-', { text: 'Sign out', handler: () => toast({ type: 'warning', text: 'Signed out (demo)' }) }] });

css.textContent += '.adm-burger{display:none}.op-layout-border.is-narrow .adm-burger{display:inline-flex}';
create({
  type: 'viewport', renderTo: document.body,
  items: [shell = create<Container>({
    type: 'container', layout: { type: 'border' }, items: [
      { type: 'toolbar', region: 'north', items: [
        { type: 'button', icon: 'menu', variant: 'ghost', cls: 'adm-burger', ariaLabel: 'Menu', handler: () => shell.layout?.toggleRegion?.('west') },
        { type: 'label', text: 'Acme Admin', cls: 'adm-brand' }, '->',
        { type: 'button', icon: 'moon', variant: 'ghost', ariaLabel: 'Toggle dark theme', tooltip: 'Toggle dark theme', handler: (b: Button) => { dark = !dark; setTheme(dark ? 'dark' : 'light'); b.setIcon(dark ? 'sun' : 'moon'); toast({ text: `${dark ? 'Dark' : 'Light'} theme` }); } },
        { type: 'button', icon: 'bell', variant: 'ghost', ariaLabel: 'Notifications', handler: () => toast({ type: 'info', title: 'New order', text: 'Acme placed order #1042' }) },
        { type: 'button', text: 'Ada', icon: 'user', variant: 'ghost', handler: (b: Button) => userMenu.showBy(b) },
      ] },
      { type: 'container', region: 'west', width: 190, cls: 'adm-nav', layout: { type: 'vbox', gap: 4 }, items: [nav('Overview', 'chart', 0), nav('Orders', 'menu', 1), nav('Settings', 'settings', 2)] },
      tabs,
    ],
  })],
});
