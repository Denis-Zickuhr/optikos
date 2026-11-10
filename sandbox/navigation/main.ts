import { create, Tabs, NavMenu, Stepper } from 'optikos';
import { page } from '../../dev/kit';

const p = page('navigation');
const body = (text: string) => ({ type: 'label', text, style: 'display:block;padding:1rem' });

p.section('Tabs', 'lazy panels (built on first visit), ←→ move and activate, Home/End, Delete closes closable tabs, R (or the ↻) reloads reloadable tabs, cancelable before-change.', (host, { watch, log }) => {
  const t = create<Tabs>({
    type: 'tabs', width: '100%', height: 180, renderTo: host,
    items: [
      { title: 'Overview', icon: 'home', items: [body('Overview content')] },
      { title: 'Activity', closable: true, items: [body('Activity content (built when first opened)')] },
      { title: 'Reports', closable: true, reloadable: true, onReload: () => new Promise((r) => setTimeout(r, 1200)), items: [body('Reports content (↻ reloads it)')] },
      { title: 'Disabled', disabled: true },
    ],
  });
  watch(t, ['change', 'close', 'reload']);
  t.on('before-close', (tab: any) => (log('before-close', tab.config.title), true));
  let n = 1;
  create({ type: 'button', text: 'Add tab', renderTo: host, handler: () => t.add({ title: `New ${n}`, closable: true, items: [body(`Tab ${n++}`)] }) });
  create({ type: 'button', text: 'Block changes', renderTo: host, toggle: true, listeners: { toggle: (on: boolean) => (off?.(), (off = on ? t.on('before-change', () => false) : undefined)) } });
  let off: (() => void) | undefined;
});

p.section('Tabs · left', 'vertical tab bar; ↑↓ navigation.', (host) => {
  create({ type: 'tabs', position: 'left', width: '100%', height: 150, renderTo: host, items: ['General', 'Security', 'Billing'].map((title) => ({ title, items: [body(`${title} settings`)] })) });
});

import { Breadcrumb } from 'optikos';

p.section('Breadcrumb', 'last item is the current page (aria-current); links use href, buttons use handlers; before-navigate can cancel.', (host, { watch, log }) => {
  const short = create<Breadcrumb>({ type: 'breadcrumb', renderTo: host, style: 'width:100%', items: [{ text: 'Home', icon: 'home', href: '#home' }, { text: 'Customers', handler: () => log('go', 'customers') }, { text: 'Ada Lovelace' }] });
  watch(short, ['navigate']);
  const long = create<Breadcrumb>({
    type: 'breadcrumb', renderTo: host, style: 'width:100%',
    items: ['Root', 'Projects', 'Optikos', 'src', 'components', 'navigation', 'breadcrumb.ts'].map((text) => ({ text, handler: () => log('go', text) })),
  });
  watch(long, ['navigate']);
  create({ type: 'label', variant: 'muted', text: 'maxItems: 4 collapses the middle into "…" (opens a menu). Try ↓ and Enter.', renderTo: host, style: 'width:100%' });
  create({ type: 'breadcrumb', renderTo: host, style: 'width:100%', maxItems: 6, items: ['A', 'B', 'C', 'D', 'E', 'F'].map((text) => ({ text, handler: () => log('go', text) })) });
  create({ type: 'breadcrumb', renderTo: host, style: 'width:100%', separator: '/', items: [{ text: 'src', icon: 'chart', handler: () => log('go', 'src') }, { text: 'index.ts' }] });
  const guarded = create<Breadcrumb>({ type: 'breadcrumb', renderTo: host, style: 'width:100%', items: [{ text: 'Form (unsaved)', handler: () => log('left the form') }, { text: 'Step 2' }] });
  guarded.on('before-navigate', () => (log('before-navigate', 'cancelled'), false));
});

p.section('NavMenu', 'sidebar tree: groups open/close, one active page, badges, rail mode (icons only), filter, accordion. Keyboard: ↑↓ move, → opens/enters, ← closes/goes to the parent, Home/End, Enter.', (host, { watch }) => {
  const items = () => [
    { id: 'dash', text: 'Dashboard', icon: 'home' },
    { id: 'sales', text: 'Sales', expanded: true, items: [{ id: 'orders', text: 'Orders', icon: 'list', badge: 12 }, { id: 'inv', text: 'Invoices', icon: 'file', badge: 3 }, { id: 'cust', text: 'Customers', icon: 'users', disabled: true }] },
    { id: 'buy', text: 'Purchasing', items: [{ id: 'po', text: 'Purchase orders', icon: 'truck' }, { id: 'sup', text: 'Suppliers', icon: 'user', items: [{ id: 'sup-a', text: 'Approved' }, { id: 'sup-b', text: 'Blocked' }] }] },
    { id: 'adm', text: 'Administration', items: [{ id: 'usr', text: 'Users', icon: 'shield' }, { id: 'set', text: 'Settings', icon: 'settings' }] },
  ];
  const box = (extra: object, width: string) => create<NavMenu>({ type: 'navmenu', items: items(), active: 'orders', ariaLabel: 'Demo menu', width, style: 'border:1px solid var(--op-color-border)', renderTo: host, ...extra });
  watch(box({}, '16rem'), ['select', 'expand', 'collapse']);
  const filterable = box({}, '16rem');
  create({ type: 'textfield', placeholder: 'Filter the menu (try "ord")…', width: 220, renderTo: host, listeners: { change: (v: string) => filterable.filter(v ?? '') } });
  box({ collapsed: true }, 'auto');
  box({ accordion: true }, '16rem');
});

p.section('Stepper', 'where you are in a process: numbered steps with done / current / error states and an "optional" tag. Click a step (before-select can veto); on a phone only the current step keeps its words.', (host, { watch }) => {
  const steps = [{ title: 'Cart', description: '3 items' }, { title: 'Shipping', description: 'Where to' }, { title: 'Payment', description: 'Card or invoice' }, { title: 'Gift note', optional: true }, { title: 'Confirm' }];
  const s = create<Stepper>({ type: 'stepper', steps, active: 1, width: '100%', renderTo: host });
  s.setStepState(0, 'done');
  watch(s, ['select']);
  create({ type: 'button', text: 'Mark current as error', renderTo: host, handler: () => s.setStepState(s.getActive(), 'error') });
  create({ type: 'button', text: 'Mark current as done', renderTo: host, handler: () => s.setStepState(s.getActive(), 'done') });
  create({ type: 'button', text: 'Next', variant: 'primary', renderTo: host, handler: () => s.setActive(s.getActive() + 1) });
  const locked = create<Stepper>({ type: 'stepper', steps: steps.slice(0, 3), active: 2, clickable: false, width: '100%', renderTo: host });
  locked.setStepState(0, 'done');
  locked.setStepState(1, 'done');
});
