import { describe, it, expect, vi, afterEach } from 'vitest';
import { create, DataView, Store } from 'optikos';

const cleanup: DataView[] = [];
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Photo ${i + 1}`, fav: false }));
const mk = (cfg: object = {}) => {
  const v = create<DataView>({ type: 'dataview', data: rows(8), renderer: (r: any) => r.data.name, selection: 'multi', ...cfg } as any);
  document.body.append(v.el);
  v.notifyMount();
  cleanup.push(v);
  return v;
};
afterEach(() => {
  cleanup.splice(0).forEach((v) => v.destroy());
  document.body.innerHTML = '';
});
const items = (v: DataView) => Array.from(v.el.querySelectorAll<HTMLElement>('.op-dataview__item'));
const sel = (v: DataView) => v.getSelection().map((r) => r.data.id);
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const click = (el: Element, init: MouseEventInit = {}) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, ...init }));
/** Pretend the items sit in rows of `n` columns (layout does not exist in happy-dom). */
const grid = (v: DataView, n: number) => items(v).forEach((el, i) => Object.defineProperty(el, 'offsetTop', { value: Math.floor(i / n) * 100, configurable: true }));

describe('DataView', () => {
  it('renders one option per record with the renderer output (text escaped), ARIA listbox', () => {
    const v = mk({ renderer: (r: any) => `<b>${r.data.name}</b>` });
    expect(v.el.getAttribute('role')).toBe('listbox');
    expect(v.el.getAttribute('aria-multiselectable')).toBe('true');
    expect(items(v)).toHaveLength(8);
    expect(items(v)[0].textContent).toBe('<b>Photo 1</b>');
    expect(items(v)[0].querySelector('b')).toBeNull();
    const m = mk({ renderer: (r: any) => Object.assign(document.createElement('i'), { textContent: r.data.name }) });
    expect(items(m)[0].querySelector('i')!.textContent).toBe('Photo 1');
  });

  it('click replaces, Ctrl toggles, Shift selects a range; single mode keeps one', () => {
    const v = mk();
    const changed = vi.fn();
    v.on('select', changed);
    click(items(v)[1]);
    click(items(v)[3], { ctrlKey: true });
    expect(sel(v)).toEqual([2, 4]);
    click(items(v)[1], { shiftKey: true }); // anchor is the last plain/toggle click: item 4 → 2..4
    expect(sel(v)).toEqual([2, 3, 4]);
    click(items(v)[6]);
    expect(sel(v)).toEqual([7]);
    expect(items(v)[6].getAttribute('aria-selected')).toBe('true');
    expect(items(v)[1].classList.contains('is-selected')).toBe(false);
    expect(changed).toHaveBeenCalled();
    const s = mk({ selection: 'single' });
    click(items(s)[0]);
    click(items(s)[2], { ctrlKey: true });
    expect(sel(s)).toEqual([3]);
    const none = mk({ selection: 'none' });
    click(items(none)[0]);
    expect(sel(none)).toEqual([]);
  });

  it('buttons with data-op-action emit item-action and do not select; click/dblclick events carry the record', () => {
    const v = mk({ renderer: (r: any) => Object.assign(document.createElement('button'), { textContent: r.data.name, className: 'heart' }) });
    const act = vi.fn();
    const clicked = vi.fn();
    const dbl = vi.fn();
    v.on('item-action', act);
    v.on('item-click', clicked);
    v.on('item-dblclick', dbl);
    const btn = items(v)[2].querySelector('button')!;
    btn.dataset.opAction = 'favorite';
    click(btn);
    expect(act.mock.calls[0][0]).toBe('favorite');
    expect(act.mock.calls[0][1].data.id).toBe(3);
    expect(sel(v)).toEqual([]);
    expect(clicked).not.toHaveBeenCalled();
    click(items(v)[4]);
    expect(clicked.mock.calls[0][0].data.id).toBe(5);
    items(v)[4].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(dbl).toHaveBeenCalledTimes(1);
  });

  it('keyboard: one tab stop; arrows move by 1 and by a row (measured columns); Home/End; Space toggles; Enter activates; Ctrl+A', () => {
    const v = mk();
    grid(v, 4);
    expect(v.columns()).toBe(4);
    expect(items(v).filter((el) => el.tabIndex === 0)).toHaveLength(1);
    items(v)[0].focus();
    key(items(v)[0], 'ArrowRight');
    expect(document.activeElement).toBe(items(v)[1]);
    key(document.activeElement!, 'ArrowDown'); // +4
    expect(document.activeElement).toBe(items(v)[5]);
    key(document.activeElement!, 'ArrowUp');
    expect(document.activeElement).toBe(items(v)[1]);
    key(document.activeElement!, 'End');
    expect(document.activeElement).toBe(items(v)[7]);
    key(document.activeElement!, 'Home');
    expect(document.activeElement).toBe(items(v)[0]);
    key(document.activeElement!, ' ');
    key(items(v)[0], 'ArrowRight');
    key(document.activeElement!, ' ');
    expect(sel(v)).toEqual([1, 2]);
    const activated = vi.fn();
    v.on('item-activate', activated);
    key(document.activeElement!, 'Enter');
    expect(activated.mock.calls[0][0].data.id).toBe(2);
    key(document.activeElement!, 'a', { ctrlKey: true });
    expect(sel(v)).toHaveLength(8);
    expect(items(v).filter((el) => el.tabIndex === 0)).toHaveLength(1);
  });

  it('Shift+arrows extends the selection in multi mode', () => {
    const v = mk();
    grid(v, 4);
    items(v)[1].focus();
    click(items(v)[1]);
    key(items(v)[1], 'ArrowRight', { shiftKey: true });
    key(document.activeElement!, 'ArrowRight', { shiftKey: true });
    expect(sel(v)).toEqual([2, 3, 4]);
  });

  it('follows the store: add/remove redraw, removed records leave the selection; empty text; paging bar', () => {
    const store = new Store<any>({ data: rows(30), pageSize: 10 });
    const v = mk({ data: undefined, store, paging: true });
    expect(items(v)).toHaveLength(10);
    expect(v.el.querySelector('.op-pagination')).not.toBeNull();
    click(items(v)[0]);
    store.remove(store.getAt(0)!);
    expect(sel(v)).toEqual([]);
    expect(items(v)).toHaveLength(10);
    store.setPage(3);
    expect(items(v)[0].textContent).toBe('Photo 22');
    const empty = mk({ data: [], emptyText: 'Nothing here' });
    expect((empty.el.querySelector('.op-dataview__empty') as HTMLElement).hidden).toBe(false);
    expect(empty.el.querySelector('.op-dataview__empty')!.textContent).toBe('Nothing here');
  });

  it('refresh() redraws after a record field changed; itemWidth becomes a custom property', () => {
    const v = mk({ itemWidth: '14rem', itemCls: (r: any) => (r.data.fav ? 'is-fav' : ''), renderer: (r: any) => `${r.data.name}${r.data.fav ? ' ★' : ''}` });
    expect(v.el.style.getPropertyValue('--op-dataview-item-width')).toBe('14rem');
    v.getStore().getAt(0)!.set('fav', true);
    v.refresh();
    expect(items(v)[0].textContent).toBe('Photo 1 ★');
    expect(items(v)[0].classList.contains('is-fav')).toBe(true);
  });
});
