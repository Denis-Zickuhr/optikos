import { create, shortcuts, setPermissionResolver, Window, MessageBox, Menu, Dropdown, toast, Form, validators, CommandPalette, setTheme, Widget, Chat, type Command } from 'optikos';
import { page } from '../../dev/kit';

const p = page('overlays');

p.section('Window', 'modal (page inert, Tab trapped, focus restored), draggable by the header, Esc closes, stacking.', (host, { log, watch }) => {
  const make = (extra: object = {}) => {
    const w = create<Window>({
      type: 'window', title: 'Edit customer', icon: 'user', closeAction: 'destroy',
      items: [{ type: 'form', items: [{ type: 'textfield', name: 'name', label: 'Name', required: true }, { type: 'datefield', name: 'since', label: 'Customer since' }] }],
      buttons: [{ text: 'Cancel', handler: () => w.close() }, { text: 'Save', variant: 'primary', handler: () => ((w.items[0] as Form).validate() ? w.close() : log('invalid')) }],
      ...extra,
    });
    watch(w, ['show', 'hide', 'close']);
    return w;
  };
  create({ type: 'button', text: 'Modal', variant: 'primary', renderTo: host, handler: () => make().show() });
  create({ type: 'button', text: 'Non-modal', renderTo: host, handler: () => make({ modal: false, title: 'Floating' }).show() });
  create({ type: 'button', text: 'Close on backdrop', renderTo: host, handler: () => make({ closeOnBackdrop: true }).show() });
  create({ type: 'button', text: 'Stacked', renderTo: host, handler: () => { make({ title: 'First' }).show(); make({ title: 'Second' }).show(); } });
  const reusable = make({ closeAction: 'hide', title: 'Reusable (hide)' });
  create({ type: 'button', text: 'Hide on close', renderTo: host, handler: () => reusable.show() });
});

p.section('MessageBox', 'Promise based: alert, confirm, danger confirm, prompt with validation, custom buttons.', (host, { log }) => {
  const btn = (text: string, fn: () => unknown) => create({ type: 'button', text, renderTo: host, handler: async () => log(text, await fn()) });
  btn('alert', () => MessageBox.alert('Your changes were saved.', { title: 'Saved' }));
  btn('confirm', () => MessageBox.confirm('Discard the draft?'));
  btn('danger confirm', () => MessageBox.confirm('Delete 3 customers? This cannot be undone.', { danger: true, okText: 'Delete', title: 'Delete customers' }));
  btn('prompt', () => MessageBox.prompt('Name of the new list?', { placeholder: 'min. 3 letters', validators: [validators.minLength(3)] }));
  btn('custom', () => MessageBox.show({ text: 'Save before leaving?', title: 'Unsaved', icon: 'alert', buttons: [{ id: 'discard', text: 'Discard', variant: 'danger' }, { id: 'cancel', text: 'Cancel' }, { id: 'save', text: 'Save', variant: 'primary' }], cancelId: 'cancel' }));
});

p.section('Menu', 'button menu with icons, check item, submenu; right-click area for a context menu; arrows, → ←, Esc.', (host, { log }) => {
  const items = [
    { text: 'New', icon: 'plus', handler: () => log('new') },
    { text: 'Rename', icon: 'edit', handler: () => log('rename') },
    { text: 'Locked', disabled: true },
    '-' as const,
    { text: 'Show hidden', checked: false, handler: (i: any) => log('hidden', i.checked) },
    { text: 'Export', items: [{ text: 'CSV', handler: () => log('csv') }, { text: 'PDF', handler: () => log('pdf') }, { text: 'More', items: [{ text: 'XML', handler: () => log('xml') }] }] },
    '-' as const,
    { text: 'Delete', icon: 'trash', handler: () => log('delete') },
  ];
  const menu = create<Menu>({ type: 'menu', items });
  const b = create<any>({ type: 'button', text: 'Actions', icon: 'chevron-down', iconPos: 'right', renderTo: host, handler: () => menu.showBy(b) });
  const area = document.createElement('div');
  area.textContent = 'Right-click here';
  area.style.cssText = 'padding:1.5rem 2rem;border:1px dashed var(--op-color-border-strong);border-radius:var(--op-radius)';
  area.addEventListener('contextmenu', (e) => { e.preventDefault(); create<Menu>({ type: 'menu', items: items.slice(0, 2) }).showAt(e.clientX, e.clientY); });
  host.append(area);
});

p.section('Dropdown', 'any content anchored to a button; flips near the viewport edge; Esc/outside click close it.', (host, { watch }) => {
  const content = document.createElement('div');
  content.style.cssText = 'padding:1rem;width:14rem';
  content.innerHTML = '<strong>Anything</strong><p style="margin:.5rem 0 0">A plain element, a component or a config.</p>';
  const b = create<any>({ type: 'button', text: 'Open dropdown', renderTo: host, handler: () => dd.toggle() });
  const dd = create<Dropdown>({ type: 'dropdown', anchor: b.el, content, placement: 'bottom-start' });
  watch(dd, ['open', 'close']);
  const b2 = create<any>({ type: 'button', text: 'Flip (bottom of page)', renderTo: host, handler: () => dd2.toggle(), style: 'margin-top:20rem' });
  const dd2 = create<Dropdown>({ type: 'dropdown', anchor: b2.el, content: Object.assign(document.createElement('div'), { textContent: 'I opened upward', style: 'padding:1rem' }) });
});

p.section('Toast · Tooltip', 'four types, positions, persistent (duration 0), timer pauses on hover; tooltips on hover and keyboard focus.', (host) => {
  const types = ['info', 'success', 'warning', 'error'] as const;
  for (const type of types) create({ type: 'button', text: type, renderTo: host, handler: () => toast({ type, title: type[0].toUpperCase() + type.slice(1), text: 'Something happened.' }) });
  create({ type: 'button', text: 'bottom-left, persistent', renderTo: host, handler: () => toast({ text: 'Stays until closed', position: 'bottom-left', duration: 0 }) });
  create({ type: 'button', text: 'stack 7', renderTo: host, handler: () => { for (let i = 1; i <= 7; i++) toast({ text: `Toast ${i}`, position: 'top' }); } });
  create({ type: 'button', icon: 'trash', ariaLabel: 'Delete', tooltip: 'Delete the selected item', renderTo: host });
  create({ type: 'button', icon: 'settings', variant: 'ghost', ariaLabel: 'Settings', tooltip: 'A longer tooltip text that wraps onto several lines when it reaches the maximum width token.', renderTo: host });
});

p.section('CommandPalette', 'Ctrl/⌘+K anywhere (or the button). Type to search (also keywords and categories), chips filter by category, ↑↓ Enter Esc; "Switch theme…" opens a second level (Backspace/Esc go back); one command is disabled, one hidden, one fails.', (host, { log, watch }) => {
  const go = (name: string): Command => ({ id: `go-${name}`, title: `Go to ${name}`, category: 'Navigation', icon: 'home', handler: () => log('go', name) });
  const palette = create<CommandPalette>({
    type: 'commandpalette',
    categories: ['Customers', 'Navigation', 'Appearance'],
    commands: [
      { id: 'new', title: 'New customer', category: 'Customers', icon: 'plus', shortcut: 'N', keywords: ['create', 'add'], handler: () => toast({ type: 'success', text: 'New customer…' }) },
      { id: 'find', title: 'Find customer', category: 'Customers', icon: 'search', description: 'Open the search window', handler: () => log('find') },
      { id: 'del', title: 'Delete selected customers', category: 'Customers', icon: 'trash', disabled: true, description: 'Select customers first' },
      go('dashboard'), go('orders'), go('settings'),
      { id: 'theme', title: 'Switch theme…', category: 'Appearance', icon: 'sun', children: ['light', 'dark', 'brutal', 'soft', 'terminal', 'editorial'].map((n) => ({ id: `th-${n}`, title: n, handler: () => setTheme(n) })) },
      { id: 'fail', title: 'Run a failing command', category: 'Appearance', handler: () => Promise.reject(new Error('this one always fails')) },
      { id: 'secret', title: 'Hidden command', hidden: () => true },
    ],
  });
  watch(palette, ['open', 'close', 'run', 'error']);
  create({ type: 'button', text: 'Open palette', icon: 'search', renderTo: host, handler: () => palette.open() });
  create({ type: 'button', text: 'Register 3 more', renderTo: host, handler: (() => { let off: (() => void) | undefined; return () => { if (off) { off(); off = undefined; log('removed'); } else { off = palette.register(Array.from({ length: 3 }, (_, i) => ({ id: `x${i}`, title: `Extra command ${i + 1}`, category: 'Extras', handler: () => log('extra', i + 1) }))); log('registered'); } }; })() });
  const noKey = create<CommandPalette>({ type: 'commandpalette', hotkey: false, commands: [{ id: 'a', title: 'Only from the button', handler: () => log('ran') }] });
  create({ type: 'button', text: 'Palette without hotkey', renderTo: host, handler: () => noKey.open() });
});

p.section('Widget', 'floats over the page (nothing is pushed), attached to an edge; not modal, so the page stays usable. Pick the side by config, by `setSide`, or let the user choose with `sideSwitcher`. `floating: false` is an ordinary panel.', (host, { watch }) => {
  const chatItems = () => [{ type: 'chat', me: 'me', flex: 1, users: { bot: { name: 'Helper' } }, messages: [{ from: 'bot', text: 'Hi! I float above the page. Try the arrows in the header to dock me elsewhere.', time: Date.now() }] }];
  const make = (extra: object) => create<Widget>({ type: 'widget', title: 'Assistant', icon: 'info', items: chatItems(), ...extra } as any);
  const user = make({ sideSwitcher: true, draggable: true, resizable: true, sides: ['left', 'right', 'top', 'bottom'] });
  watch(user, ['show', 'hide', 'side-change', 'move']);
  create({ type: 'button', text: 'Open (user picks the side, draggable, resizable)', variant: 'primary', renderTo: host, handler: () => user.setOpen() });
  for (const side of ['right', 'left', 'bottom', 'top'] as const) {
    const w = make({ side, title: `Docked ${side}` });
    create({ type: 'button', text: `Open ${side}`, renderTo: host, handler: () => w.setOpen() });
  }
  const big = make({ side: 'right', size: '34rem', title: 'Wide (size: 34rem)' });
  create({ type: 'button', text: 'Custom size', renderTo: host, handler: () => big.setOpen() });
  create({ type: 'button', text: 'Set side → left (code)', renderTo: host, handler: () => user.setSide('left') });
  const docked = create<Widget>({ type: 'widget', floating: false, hidden: false, title: 'floating: false (an ordinary panel here)', height: 220, width: '100%', items: [{ type: 'label', text: 'Placed by the layout, not floating.', style: 'padding:1rem' }], renderTo: host });
  void docked; void Chat;
});

p.section('Window · confirmDiscard', 'closing (X, Esc, Cancel) while a field inside changed asks first; an untouched window closes at once.', (host) => {
  create({ type: 'button', text: 'Open an editor', renderTo: host, handler: () => {
    const w: Window = create({ type: 'window', title: 'Edit lot', width: 340, closable: true, confirmDiscard: true, items: [{ type: 'textfield', name: 'name', label: 'Name (change it, then close)', value: 'Lot 12' }], buttons: [{ text: 'Close', handler: () => w.close() }] } as never);
    w.show();
  } });
});

p.section('Shortcuts', 'global mod+g, a screen scope (switch it), and ? for the help panel (grouped by scope). Same keys twice in a scope warn in dev.', (host, { log }) => {
  shortcuts.register({ keys: 'mod+g', title: 'Say hello', handler: () => log('hello') });
  for (const scope of ['lots', 'events']) shortcuts.register({ keys: 'alt+n', title: `New (${scope})`, scope, handler: () => log(`new in ${scope}`) });
  for (const scope of ['lots', 'events']) create({ type: 'button', text: `Scope: ${scope}`, renderTo: host, handler: () => (shortcuts.setScope(scope), log('scope', scope)) });
  create({ type: 'button', text: 'Help (?)', renderTo: host, handler: () => shortcuts.help() });
});

p.section('Permission', 'one resolver, a `permission` on anything: hidden by default, or disabled. Toggle the role.', (host, { log }) => {
  let admin = false;
  setPermissionResolver((perm) => admin || perm === 'view');
  const build = () => {
    host.querySelectorAll('.pm').forEach((e) => e.remove());
    const box = Object.assign(document.createElement('div'), { className: 'pm' });
    host.append(box);
    create({ type: 'button', text: 'Edit (view)', permission: 'view', renderTo: box });
    create({ type: 'button', text: 'Delete (admin, hidden)', variant: 'danger', permission: 'delete', renderTo: box });
    create({ type: 'button', text: 'Approve (admin, disabled)', permission: 'approve', permissionMode: 'disable', renderTo: box });
    const m = create<Menu>({ type: 'menu', items: [{ text: 'Open' }, { text: 'Archive', permission: 'delete' }] });
    create({ type: 'button', text: 'Menu', renderTo: box, handler: (b: { el: HTMLElement }) => m.showBy(b.el) } as never);
  };
  create({ type: 'button', text: 'Toggle admin', renderTo: host, handler: () => ((admin = !admin), log('admin', admin), build()) });
  build();
});
