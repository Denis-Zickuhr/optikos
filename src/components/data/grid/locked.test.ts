import { describe, it, expect, afterEach } from 'vitest';
import { create, Grid, Store } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const mk = (cols: object[], cfg = {}) =>
  create<Grid>({ type: 'grid', renderTo: document.body, store: new Store({ data: [{ a: 1, b: 2, c: 3, d: 4 }] }), columns: cols, ...cfg } as any);
const head = (g: Grid) => Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__hcell'));

describe('locked columns', () => {
  it('keep together at their edge whatever the order, with classes and sticky offsets', () => {
    const g = mk([{ field: 'a' }, { field: 'b', locked: 'end', width: 80 }, { field: 'c', locked: 'start', width: 100 }, { field: 'd', locked: 'start', width: 60 }]);
    expect(head(g).map((h) => h.dataset.field)).toEqual(['c', 'd', 'a', 'b']);
    expect(head(g).map((h) => h.classList.contains('is-locked-start') ? 's' : h.classList.contains('is-locked-end') ? 'e' : '-').join('')).toBe('ss-e');
    const cells = Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__body-row .op-grid__cell'));
    expect(cells[1].style.getPropertyValue('--_lock')).toBe('var(--op-grid-lock-1)');
    expect(g.el.style.getPropertyValue('--op-grid-lock-0')).toBe('0px');
    expect(g.el.style.getPropertyValue('--op-grid-lock-1')).toBe('calc(100px)');
    expect(head(g)[1].classList.contains('is-lock-edge')).toBe(true);
    expect(head(g)[3].classList.contains('is-lock-edge')).toBe(true);
    expect(g.el.style.getPropertyValue('--op-grid-cols')).toBe('100px 60px minmax(96px, 1fr) 80px');
  });

  it('the checkbox column sticks at the start and the actions column at the end; the offsets count them', () => {
    const g = mk([{ field: 'a', locked: 'start', width: 100 }, { field: 'b' }], { checkboxSelection: true, rowActions: [{ text: 'x', handler() {} }] });
    const h = head(g);
    expect(h[0].classList.contains('is-locked-start')).toBe(true);
    expect(h[h.length - 1].classList.contains('is-locked-end')).toBe(true);
    expect(g.el.style.getPropertyValue('--op-grid-lock-1')).toBe('calc(44px)');
  });

  it('setColumnLocked pins and releases, and the state round-trips', () => {
    const g = mk([{ field: 'a' }, { field: 'b' }, { field: 'c' }]);
    let n = 0;
    g.on('columns-change', () => n++);
    g.setColumnLocked('c', 'start');
    expect(head(g).map((h) => h.dataset.field)).toEqual(['c', 'a', 'b']);
    const state = g.getColumnState();
    expect(state.find((s) => s.field === 'c')!.locked).toBe('start');
    const g2 = mk([{ field: 'a' }, { field: 'b' }, { field: 'c' }]);
    g2.setColumnState(state);
    expect(head(g2).map((h) => h.dataset.field)).toEqual(['c', 'a', 'b']);
    g.setColumnLocked('c', null);
    expect(head(g).map((h) => h.dataset.field)).toEqual(['a', 'b', 'c']);
    expect(n).toBe(2);
  });

  it('moving a column cannot put it among the locked ones, and scrolling sets the edge classes', () => {
    const g = mk([{ field: 'a', locked: 'start', width: 90 }, { field: 'b' }, { field: 'c' }]);
    g.moveColumn('c', 'a');
    expect(head(g).map((h) => h.dataset.field)).toEqual(['a', 'c', 'b']);
    const vp = g.el.querySelector('.op-grid__viewport') as HTMLElement;
    Object.defineProperty(vp, 'scrollWidth', { value: 500, configurable: true });
    Object.defineProperty(vp, 'clientWidth', { value: 300, configurable: true });
    vp.scrollLeft = 40;
    vp.dispatchEvent(new Event('scroll'));
    expect(g.el.classList.contains('is-scrolled-start')).toBe(true);
    expect(g.el.classList.contains('is-scrolled-end')).toBe(true);
    expect(g.el.style.getPropertyValue('--op-grid-scroll-x')).toBe('40px');
    expect(g.el.style.getPropertyValue('--op-grid-scroll-end')).toBe('160px');
  });
});
