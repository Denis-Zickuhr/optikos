import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, NavMenu } from 'optikos';

const cleanup: NavMenu[] = [];
const items = () => [
  { id: 'dash', text: 'Dashboard', icon: 'home' },
  { id: 'sales', text: 'Sales', icon: 'chart', items: [{ id: 'orders', text: 'Orders', badge: 3 }, { id: 'invoices', text: 'Invoices' }, { id: 'customers', text: 'Customers', disabled: true }] },
  { id: 'buy', text: 'Purchasing', items: [{ id: 'po', text: 'Purchase orders' }, { id: 'sup', text: 'Suppliers', hidden: true }] },
  { id: 'empty', text: 'Nothing here', items: [{ id: 'x', text: 'x', hidden: true }] },
];
const mk = (cfg: object = {}) => {
  const n = create<NavMenu>({ type: 'navmenu', items: items(), ariaLabel: 'Main', ...cfg } as any);
  document.body.append(n.el);
  cleanup.push(n);
  return n;
};
afterEach(() => {
  cleanup.splice(0).forEach((n) => n.destroy());
  document.body.innerHTML = '';
});
const row = (n: NavMenu, id: string) => n.el.querySelector<HTMLElement>(`[data-id="${id}"]`);
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const ids = (n: NavMenu) => Array.from(n.el.querySelectorAll<HTMLElement>('.op-navmenu__item')).map((r) => r.dataset.id);

describe('NavMenu', () => {
  it('renders an ARIA tree; groups start closed, empty groups and hidden items do not show', () => {
    const n = mk();
    expect(n.el.tagName).toBe('NAV');
    expect(n.el.querySelector('[role=tree]')!.getAttribute('aria-label')).toBe('Main');
    expect(ids(n)).toEqual(['dash', 'sales', 'buy']);
    expect(row(n, 'sales')!.getAttribute('aria-expanded')).toBe('false');
    expect(row(n, 'dash')!.hasAttribute('aria-expanded')).toBe(false);
  });

  it('clicking a group opens it (and closes with a second click); a leaf selects, becomes aria-current, and emits', () => {
    const n = mk();
    const exp = vi.fn();
    const sel = vi.fn();
    n.on('expand', exp);
    n.on('select', sel);
    row(n, 'sales')!.click();
    expect(ids(n)).toEqual(['dash', 'sales', 'orders', 'invoices', 'customers', 'buy']);
    expect(row(n, 'orders')!.querySelector('.op-navmenu__badge')!.textContent).toBe('3');
    row(n, 'orders')!.click();
    expect(sel.mock.calls[0][0].id).toBe('orders');
    expect(n.getActive()!.id).toBe('orders');
    expect(row(n, 'orders')!.getAttribute('aria-current')).toBe('page');
    expect(exp).toHaveBeenCalledTimes(1);
    row(n, 'sales')!.click();
    expect(ids(n)).toEqual(['dash', 'sales', 'buy']);
  });

  it('disabled leaves do nothing; before-select can cancel', () => {
    const n = mk();
    n.expand('sales');
    const sel = vi.fn();
    n.on('select', sel);
    row(n, 'customers')!.click();
    expect(sel).not.toHaveBeenCalled();
    n.on('before-select', (i: any) => i.id !== 'invoices');
    row(n, 'invoices')!.click();
    expect(sel).not.toHaveBeenCalled();
    expect(n.getActive()).toBeUndefined();
  });

  it('setActive opens the parents of the leaf without emitting select; config.active does too', () => {
    const n = mk({ active: 'po' });
    expect(ids(n)).toContain('po');
    expect(row(n, 'po')!.classList.contains('is-active')).toBe(true);
    const sel = vi.fn();
    n.on('select', sel);
    n.setActive('invoices');
    expect(row(n, 'invoices')).not.toBeNull();
    expect(sel).not.toHaveBeenCalled();
  });

  it('accordion: opening a group closes its siblings', () => {
    const n = mk({ accordion: true });
    n.expand('sales');
    n.expand('buy');
    expect(ids(n)).toEqual(['dash', 'sales', 'buy', 'po']);
  });

  it('updateItem changes the badge in place; setItems replaces; expandAll/collapseAll', () => {
    const n = mk();
    n.expandAll();
    expect(ids(n)).toContain('orders');
    n.updateItem('orders', { badge: 12 });
    expect(row(n, 'orders')!.querySelector('.op-navmenu__badge')!.textContent).toBe('12');
    n.collapseAll();
    expect(ids(n)).toEqual(['dash', 'sales', 'buy']);
    n.setItems([{ id: 'only', text: 'Only' }]);
    expect(ids(n)).toEqual(['only']);
  });

  it('filter hides what does not match and opens groups with a match; empty clears', () => {
    const n = mk();
    n.filter('inv');
    expect(ids(n)).toEqual(['sales', 'invoices']);
    n.filter('purchase');
    expect(ids(n)).toEqual(['buy', 'po']);
    n.filter('');
    expect(ids(n)).toEqual(['dash', 'sales', 'buy']);
  });

  it('rail mode: icons only, every group open, text kept as title', () => {
    const n = mk({ collapsed: true });
    expect(n.el.classList.contains('is-rail')).toBe(true);
    expect(ids(n)).toContain('orders');
    expect(row(n, 'dash')!.title).toBe('Dashboard');
    n.setCollapsed(false);
    expect(n.el.classList.contains('is-rail')).toBe(false);
    expect(ids(n)).not.toContain('orders');
  });

  it('keyboard (APG tree): arrows move, → opens then enters, ← closes then goes to the parent, Enter selects, one tab stop', () => {
    const n = mk();
    const sel = vi.fn();
    n.on('select', sel);
    expect(n.el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    row(n, 'dash')!.focus();
    key(row(n, 'dash')!, 'ArrowDown');
    expect(document.activeElement).toBe(row(n, 'sales'));
    key(document.activeElement!, 'ArrowRight'); // opens
    expect(row(n, 'sales')!.getAttribute('aria-expanded')).toBe('true');
    key(document.activeElement!, 'ArrowRight'); // into the group
    expect(document.activeElement).toBe(row(n, 'orders'));
    key(document.activeElement!, 'Enter');
    expect(sel).toHaveBeenCalledTimes(1);
    key(document.activeElement!, 'ArrowLeft'); // back to the parent
    expect(document.activeElement).toBe(row(n, 'sales'));
    key(document.activeElement!, 'ArrowLeft'); // closes
    expect(row(n, 'sales')!.getAttribute('aria-expanded')).toBe('false');
    key(document.activeElement!, 'End');
    expect(document.activeElement).toBe(row(n, 'buy'));
    key(document.activeElement!, 'Home');
    expect(document.activeElement).toBe(row(n, 'dash'));
    expect(n.el.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });
});
