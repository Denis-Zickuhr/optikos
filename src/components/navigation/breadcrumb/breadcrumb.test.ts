import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, Breadcrumb } from 'optikos';

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const cleanup: Array<{ destroy(): void }> = [];
const mk = (cfg: object = {}) => {
  const b = create<Breadcrumb>({ type: 'breadcrumb', items: [{ text: 'Home', href: '/' }, { text: 'Docs', handler: vi.fn() }, { text: 'Guide' }], ...cfg });
  b.mount();
  cleanup.push(b);
  return b;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const crumbs = (b: Breadcrumb) => Array.from(b.el.querySelectorAll('li')).map((li) => li.textContent);

describe('Breadcrumb', () => {
  it('renders a labelled nav > ol with links, buttons and the current page', () => {
    const b = mk();
    expect(b.el.tagName).toBe('NAV');
    expect(b.el.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(b.el.querySelector('ol')).not.toBeNull();
    expect(crumbs(b)).toEqual(['Home', 'Docs', 'Guide']);
    expect(b.el.querySelector('a')!.getAttribute('href')).toBe('/');
    expect(b.el.querySelectorAll('button.op-breadcrumb__item')).toHaveLength(1);
    const current = b.el.querySelector('[aria-current=page]')!;
    expect(current.textContent).toBe('Guide');
    expect(current.tagName).toBe('SPAN');
    expect(b.el.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('custom ariaLabel, icons, separator and setters', () => {
    const b = mk({ ariaLabel: 'You are here', separator: '/', items: [{ text: 'A', icon: 'home', href: '#' }, { text: 'B' }] });
    expect(b.el.getAttribute('aria-label')).toBe('You are here');
    expect(b.el.querySelector('.op-icon')).not.toBeNull();
    expect(b.el.style.getPropertyValue('--op-breadcrumb-separator')).toBe('"/"');
    b.setSeparator('>');
    expect(b.el.style.getPropertyValue('--op-breadcrumb-separator')).toBe('">"');
    b.setItems([{ text: 'Only' }]);
    expect(crumbs(b)).toEqual(['Only']);
    expect(b.el.querySelector('[aria-current=page]')!.textContent).toBe('Only');
  });

  it('click runs before-navigate, handler and navigate; the current item does nothing', () => {
    const handler = vi.fn();
    const b = mk({ items: [{ text: 'A', handler }, { text: 'B' }, { text: 'C' }] });
    const before = vi.fn();
    const nav = vi.fn();
    b.on('before-navigate', before);
    b.on('navigate', nav);
    (b.el.querySelector('button.op-breadcrumb__item') as HTMLElement).click();
    expect(before).toHaveBeenCalledWith(expect.objectContaining({ text: 'A' }), 0);
    expect(handler).toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith(expect.objectContaining({ text: 'A' }), 0);
    (b.el.querySelector('[aria-current]') as HTMLElement).click();
    expect(nav).toHaveBeenCalledTimes(1);
  });

  it('before-navigate cancels: no handler, and a link click is default-prevented', () => {
    const handler = vi.fn();
    const b = mk({ items: [{ text: 'A', href: '#x', handler }, { text: 'B' }] });
    b.on('before-navigate', () => false);
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    b.el.querySelector('a')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it('collapses the middle with a "…" button when over maxItems', () => {
    const items = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((text) => ({ text, handler: vi.fn() }));
    const b = mk({ items });
    expect(crumbs(b)).toEqual(['One', '…', 'Five', 'Six']);
    const more = b.el.querySelector('.op-breadcrumb__more')!;
    expect(more.getAttribute('aria-haspopup')).toBe('menu');
    expect(more.getAttribute('aria-label')).toBe('Show more');
    b.setMaxItems(6);
    expect(crumbs(b)).toEqual(['One', 'Two', 'Three', 'Four', 'Five', 'Six']);
    b.setMaxItems(1); // minimum is 3
    expect(crumbs(b)).toEqual(['One', '…', 'Six']);
  });

  it('the "…" menu lists hidden items in order, supports the keyboard and navigates', () => {
    const items = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map((text) => ({ text, handler: vi.fn() }));
    const b = mk({ items });
    const nav = vi.fn();
    b.on('navigate', nav);
    const more = b.el.querySelector('.op-breadcrumb__more') as HTMLElement;
    more.click();
    expect(more.getAttribute('aria-expanded')).toBe('true');
    const rows = Array.from(document.querySelectorAll<HTMLElement>('.op-layer .op-menu__item'));
    expect(rows.map((r) => r.textContent)).toEqual(['Two', 'Three', 'Four']);
    expect(document.activeElement).toBe(rows[0]);
    key(rows[0], 'ArrowDown');
    key(document.activeElement!, 'Enter');
    expect(items[2].handler).toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith(expect.objectContaining({ text: 'Three' }), 2);
    expect(more.getAttribute('aria-expanded')).toBe('false');
  });

  it('cancelling before-navigate from the menu keeps the handler from running', () => {
    const items = ['One', 'Two', 'Three', 'Four', 'Five'].map((text) => ({ text, handler: vi.fn() }));
    const b = mk({ items });
    b.on('before-navigate', () => false);
    (b.el.querySelector('.op-breadcrumb__more') as HTMLElement).click();
    (document.querySelector('.op-layer .op-menu__item') as HTMLElement).click();
    expect(items[1].handler).not.toHaveBeenCalled();
  });

  it('destroy removes the nav and its menu', () => {
    const items = ['A', 'B', 'C', 'D', 'E'].map((text) => ({ text }));
    const b = mk({ items });
    (b.el.querySelector('.op-breadcrumb__more') as HTMLElement).click();
    b.destroy();
    expect(document.querySelector('.op-breadcrumb')).toBeNull();
    expect(document.querySelector('[role=menu]')).toBeNull();
  });
});
