import { describe, it, expect, expectTypeOf, vi, afterEach } from 'vitest';
import { create, Select as SelectField, Grid, Table, Pagination, Store, Model, cellEditing, registerFormat, registerLookup, localViewStorage, restViewStorage } from 'optikos';

const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const type = (f: any, text: string) => {
  f.getInput().value = text;
  f.getInput().dispatchEvent(new Event('input', { bubbles: true }));
};
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `Name ${String(i + 1).padStart(3, '0')}`, total: (i + 1) * 10, on: i % 2 === 0 }));
const cleanup: Array<{ destroy(): void }> = [];
const mk = <T,>(cfg: object): T => {
  const c = create(cfg as any) as any;
  c.mount();
  cleanup.push(c);
  return c;
};
afterEach(() => {
  cleanup.splice(0).forEach((c) => c.destroy());
  document.body.innerHTML = '';
});
const cols = [{ field: 'id', header: '#', width: 60, sortable: true }, { field: 'name', header: 'Name', sortable: true }, { field: 'total', header: 'Total', format: 'money', align: 'right' as const }];
const body = (g: Grid) => Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__body-row')).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
const text = (r: HTMLElement) => Array.from(r.children).map((c) => c.textContent);

describe('Table', () => {
  it('renders captions, headers, formatted cells, empty state; reacts to store changes', () => {
    const t = mk<Table>({ type: 'table', caption: 'Orders', data: rows(2), columns: [{ field: 'name', header: 'Name' }, { field: 'total', format: 'money', align: 'right' }, { field: 'on', renderer: (v: boolean) => (v ? 'yes' : 'no') }, { field: 'id', hidden: true }] });
    expect(t.el.querySelector('caption')!.textContent).toBe('Orders');
    expect(Array.from(t.el.querySelectorAll('th')).map((x) => [x.textContent, x.getAttribute('scope')])).toEqual([['Name', 'col'], ['total', 'col'], ['on', 'col']]);
    expect(Array.from(t.el.querySelectorAll('tbody tr:first-child td')).map((x) => x.textContent)).toEqual(['Name 001', '$10.00', 'yes']);
    t.setData([]);
    expect(t.el.querySelector('.op-table__empty')!.textContent).toBe('No data');
    const store = new Store({ data: rows(1) });
    t.setStore(store);
    store.add({ name: 'Added' });
    expect(t.el.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('text content is escaped', () => {
    const t = mk<Table>({ type: 'table', data: [{ a: '<b>x</b>' }], columns: [{ field: 'a' }] });
    expect(t.el.querySelector('td')!.innerHTML).toBe('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('Pagination', () => {
  const page = (p: Pagination) => Array.from(p.el.querySelectorAll('button[data-page]')).map((b) => b.textContent!);
  it('manual mode: window with ellipses, aria-current, info, events', () => {
    const p = mk<Pagination>({ type: 'pagination', total: 200, pageSize: 10, page: 10 });
    expect(page(p).filter((x) => /^\d+$/.test(x))).toEqual(['1', '9', '10', '11', '20']);
    expect(p.el.querySelectorAll('.op-pagination__gap')).toHaveLength(2);
    expect(p.el.querySelector('[aria-current=page]')!.textContent).toBe('10');
    expect(p.el.querySelector('.op-pagination__info')!.textContent).toBe('91–100 of 200');
    expect(p.el.getAttribute('aria-label')).toBe('Pagination');
    const change = vi.fn();
    p.on('page-change', change);
    (p.el.querySelector('[aria-label="Next page"]') as HTMLElement).click();
    expect(change).toHaveBeenCalledWith(11);
    expect(p.getPage()).toBe(11);
    p.on('before-page-change', () => false);
    p.setPage(3);
    expect(p.getPage()).toBe(11);
  });

  it('edges disable first/prev and next/last; few pages show all numbers', () => {
    const p = mk<Pagination>({ type: 'pagination', total: 50, pageSize: 10 });
    expect(page(p).filter((x) => /^\d+$/.test(x))).toEqual(['1', '2', '3', '4', '5']);
    expect((p.el.querySelector('[aria-label="Previous page"]') as HTMLButtonElement).disabled).toBe(true);
    p.setPage(5);
    expect((p.el.querySelector('[aria-label="Next page"]') as HTMLButtonElement).disabled).toBe(true);
    p.setTotal(0);
    expect(p.getPage()).toBe(5);
  });

  it('store mode drives and follows the store', () => {
    const store = new Store({ data: rows(95), pageSize: 20 });
    const p = mk<Pagination>({ type: 'pagination', store });
    expect(p.el.querySelector('.op-pagination__info')!.textContent).toBe('1–20 of 95');
    (p.el.querySelector('[data-page="3"]') as HTMLElement).click();
    expect(store.page).toBe(3);
    expect(store.getAt(0)!.data.id).toBe(41);
    store.setPage(5);
    expect(p.el.querySelector('[aria-current=page]')!.textContent).toBe('5');
    expect(p.el.querySelector('.op-pagination__info')!.textContent).toBe('81–95 of 95');
  });
});

describe('Grid', () => {
  it('renders header + only the visible rows of 100,000, with correct ARIA', () => {
    const store = new Store({ data: rows(100000) });
    const g = mk<Grid>({ type: 'grid', store, columns: cols, height: 300, ariaLabel: 'Orders' });
    expect(g.el.querySelector('.op-grid__table')!.getAttribute('role')).toBe('grid');
    expect(g.el.querySelector('[role=grid]')!.getAttribute('aria-rowcount')).toBe('100001');
    expect(g.el.querySelector('[role=grid]')!.getAttribute('aria-colcount')).toBe('3');
    expect(g.el.querySelectorAll('[role=columnheader]')).toHaveLength(3);
    const r = body(g);
    expect(r.length).toBeLessThan(50);
    expect(text(r[0])).toEqual(['1', 'Name 001', '$10.00']);
    expect(r[0].getAttribute('aria-rowindex')).toBe('2');
    const viewport = g.el.querySelector('.op-grid__viewport') as HTMLElement;
    viewport.scrollTop = 36 * 50000;
    viewport.dispatchEvent(new Event('scroll'));
    const shown = body(g).map((x) => Number(x.dataset.i));
    expect(Math.min(...shown)).toBeGreaterThan(49900);
    expect(body(g).length).toBeLessThan(50);
    expect(g.el.querySelectorAll('.op-grid__body-row').length).toBeLessThan(50);
  });

  it('sorting cycles asc → desc → none, updates aria-sort and emits events; before-sort cancels', () => {
    const g = mk<Grid>({ type: 'grid', data: rows(5).reverse(), columns: cols });
    const header = (f: string) => g.el.querySelector(`[data-field="${f}"]`) as HTMLElement;
    const sort = vi.fn();
    g.on('sort', sort);
    expect(header('id').getAttribute('aria-sort')).toBe('none');
    expect(header('total').hasAttribute('aria-sort')).toBe(false);
    (header('id').querySelector('button') as HTMLElement).click();
    expect(header('id').getAttribute('aria-sort')).toBe('ascending');
    expect(text(body(g)[0])[0]).toBe('1');
    (header('id').querySelector('button') as HTMLElement).click();
    expect(header('id').getAttribute('aria-sort')).toBe('descending');
    expect(text(body(g)[0])[0]).toBe('5');
    (header('id').querySelector('button') as HTMLElement).click();
    expect(header('id').getAttribute('aria-sort')).toBe('none');
    expect(sort.mock.calls.map((c) => c[1])).toEqual(['asc', 'desc', null]);
    const off = g.on('before-sort', () => false);
    (header('name').querySelector('button') as HTMLElement).click();
    expect(g.getStore().getSorters()).toHaveLength(0);
    off();
  });

  it('single selection by click and keyboard; row-click/dblclick/activate events', () => {
    const g = mk<Grid>({ type: 'grid', data: rows(10), columns: cols });
    const sel = vi.fn();
    const click = vi.fn();
    const dbl = vi.fn();
    const act = vi.fn();
    g.on('select', sel);
    g.on('row-click', click);
    g.on('row-dblclick', dbl);
    g.on('row-activate', act);
    body(g)[2].click();
    expect(g.getSelection().map((r) => r.data.id)).toEqual([3]);
    expect(body(g)[2].getAttribute('aria-selected')).toBe('true');
    expect(click).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 3 }) }), 2, expect.anything());
    body(g)[2].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(dbl).toHaveBeenCalled();
    g.el.focus();
    key(g.el, 'ArrowDown');
    expect(g.getSelection().map((r) => r.data.id)).toEqual([4]);
    expect(g.el.querySelector('[role=grid]')!.getAttribute('aria-activedescendant')).toBe(body(g)[3].id);
    key(g.el, 'End');
    expect(g.getSelection()[0].data.id).toBe(10);
    key(g.el, 'Home');
    expect(g.getSelection()[0].data.id).toBe(1);
    key(g.el, 'Enter');
    expect(act).toHaveBeenCalled();
    expect(sel).toHaveBeenCalled();
  });

  it('multi selection: ctrl toggles, shift ranges, space, ctrl+A, shift+arrow', () => {
    const g = mk<Grid>({ type: 'grid', data: rows(10), columns: cols, selection: 'multi' });
    const ids = () => g.getSelection().map((r) => r.data.id).sort((a, b) => a - b);
    expect(g.el.querySelector('[role=grid]')!.getAttribute('aria-multiselectable')).toBe('true');
    body(g)[1].click();
    body(g)[4].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    expect(ids()).toEqual([2, 5]);
    body(g)[1].dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    expect(ids()).toEqual([5]);
    body(g)[2].click();
    body(g)[6].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    expect(ids()).toEqual([3, 4, 5, 6, 7]);
    key(g.el, 'a', { ctrlKey: true });
    expect(g.getSelection()).toHaveLength(10);
    g.deselectAll();
    expect(g.getSelection()).toHaveLength(0);
    body(g)[0].click();
    key(g.el, 'ArrowDown', { shiftKey: true });
    key(g.el, 'ArrowDown', { shiftKey: true });
    expect(ids()).toEqual([1, 2, 3]);
    key(g.el, 'ArrowDown', { ctrlKey: true });
    key(g.el, ' ');
    expect(ids()).toEqual([1, 2, 3, 4]);
  });

  it('selection none ignores clicks; select() API and removed records drop out of the selection', () => {
    const g = mk<Grid>({ type: 'grid', data: rows(3), columns: cols, selection: 'none' });
    body(g)[0].click();
    expect(g.getSelection()).toHaveLength(0);
    const h = mk<Grid>({ type: 'grid', data: rows(3), columns: cols });
    h.select(1);
    expect(h.getSelection()[0].data.id).toBe(2);
    h.getStore().remove(1);
    expect(h.getSelection()).toHaveLength(0);
  });

  it('formats, renderers (text escaped, nodes allowed), alignment and custom formats', () => {
    registerFormat('shout', (v) => String(v).toUpperCase());
    const g = mk<Grid>({
      type: 'grid',
      data: [{ a: 'x<y', b: 'hi', c: 5 }],
      columns: [{ field: 'a' }, { field: 'b', format: 'shout' }, { field: 'c', renderer: (v: number) => Object.assign(document.createElement('b'), { textContent: `#${v}` }), align: 'center' }],
    });
    const cells = Array.from(body(g)[0].children) as HTMLElement[];
    expect(cells[0].innerHTML).toBe('x&lt;y');
    expect(cells[1].textContent).toBe('HI');
    expect(cells[2].querySelector('b')!.textContent).toBe('#5');
    expect(cells[2].classList.contains('op-grid__cell--center')).toBe(true);
  });

  it('empty and loading states; store events keep it in sync', async () => {
    const store = new Store<any>({ proxy: async () => { await new Promise((r) => setTimeout(r, 5)); return rows(3); } });
    const g = mk<Grid>({ type: 'grid', store, columns: cols });
    expect(g.el.querySelector('.op-grid__empty')!.hasAttribute('hidden')).toBe(false);
    const p = store.load();
    expect(g.el.classList.contains('is-loading')).toBe(true);
    await p;
    expect(g.el.classList.contains('is-loading')).toBe(false);
    expect(body(g)).toHaveLength(3);
    expect((g.el.querySelector('.op-grid__empty') as HTMLElement).hidden).toBe(true);
    store.add({ id: 99, name: 'Late', total: 1 });
    expect(body(g)).toHaveLength(4);
    store.clear();
    expect((g.el.querySelector('.op-grid__empty') as HTMLElement).hidden).toBe(false);
  });

  it('paging: adds a Pagination bound to the store; ranges and aria-rowindex follow the page', () => {
    const store = new Store({ data: rows(95), pageSize: 20 });
    const g = mk<Grid>({ type: 'grid', store, columns: cols, paging: true });
    expect(g.el.querySelector('.op-pagination')).not.toBeNull();
    expect(body(g)).toHaveLength(20);
    (g.el.querySelector('[data-page="2"]') as HTMLElement).click();
    expect(text(body(g)[0])[0]).toBe('21');
    expect(body(g)[0].getAttribute('aria-rowindex')).toBe('22');
    expect(g.el.querySelector('[role=grid]')!.getAttribute('aria-rowcount')).toBe('96');
    const defaults = mk<Grid>({ type: 'grid', data: rows(50), columns: cols, paging: true, pageSize: 10 });
    expect(body(defaults)).toHaveLength(10);
  });

  it('setColumns / setStore rebuild; destroy removes DOM and detaches from the store', () => {
    const store = new Store({ data: rows(3) });
    const g = mk<Grid>({ type: 'grid', store, columns: cols });
    g.setColumns([{ field: 'name', header: 'Only' }]);
    expect(g.el.querySelectorAll('[role=columnheader]')).toHaveLength(1);
    expect(text(body(g)[0])).toEqual(['Name 001']);
    const other = new Store({ data: [{ name: 'Z' }] });
    g.setStore(other);
    expect(text(body(g)[0])).toEqual(['Z']);
    store.add({ name: 'ignored' });
    expect(body(g)).toHaveLength(1);
    g.destroy();
    other.add({ name: 'after destroy' });
    expect(document.querySelector('.op-grid')).toBeNull();
  });

  it('tokens: fixed columns, flex columns and min width are exposed as custom properties', () => {
    const g = mk<Grid>({ type: 'grid', data: rows(1), columns: [{ field: 'id', width: 80 }, { field: 'name', flex: 2, minWidth: 120 }] });
    expect(g.el.style.getPropertyValue('--op-grid-cols')).toBe('80px minmax(120px, 2fr)');
    expect(g.el.style.getPropertyValue('--op-grid-min-width')).toBe('200px');
  });
});

describe('Grid: checkbox selection, bulk actions, column menu', () => {
  const sel = (g: Grid) => g.getSelection().map((r) => r.data.id).sort((a, b) => a - b);
  const mkGrid = (extra: object = {}) => {
    const g = mk<Grid>({ type: 'grid', data: rows(5), columns: cols, rowHeight: 30, checkboxSelection: true, ...extra });
    document.body.append(g.el);
    return g;
  };
  const check = (g: Grid, i: number) => (body(g)[i].querySelector('.op-grid__check') as HTMLInputElement);

  it('adds a checkbox column; row checkboxes toggle without clearing', () => {
    const g = mkGrid();
    expect(g.el.querySelectorAll('.op-grid__header-row > *')).toHaveLength(4);
    check(g, 0).click();
    check(g, 2).click();
    expect(sel(g)).toEqual([1, 3]);
    expect(check(g, 0).checked).toBe(true);
    body(g)[0].children[1].dispatchEvent(new MouseEvent('click', { bubbles: true })); // plain row click toggles too
    expect(sel(g)).toEqual([3]);
  });

  it('header checkbox selects the page and is indeterminate for a partial selection', () => {
    const g = mkGrid();
    const all = g.el.querySelector<HTMLInputElement>('.op-grid__header-row .op-grid__check')!;
    check(g, 1).click();
    expect(all.indeterminate).toBe(true);
    expect(all.checked).toBe(false);
    all.click();
    expect(sel(g)).toEqual([1, 2, 3, 4, 5]);
    expect(all.checked).toBe(true);
    expect(all.indeterminate).toBe(false);
    all.click();
    expect(sel(g)).toEqual([]);
  });

  it('bulk bar shows the count and runs actions with the selected records; clear empties it', () => {
    const run = vi.fn();
    const g = mkGrid({ bulkActions: [{ text: 'Delete', handler: run }] });
    const bulk = g.el.querySelector<HTMLElement>('.op-grid__bulk')!;
    expect(bulk.hidden).toBe(true);
    check(g, 0).click();
    check(g, 1).click();
    expect(bulk.hidden).toBe(false);
    expect(bulk.querySelector('.op-grid__count')!.textContent).toBe('2 selected');
    Array.from(bulk.querySelectorAll('button')).find((b) => b.textContent!.includes('Delete'))!.click();
    expect(run.mock.calls[0][0].map((r: any) => r.data.id)).toEqual([1, 2]);
    Array.from(bulk.querySelectorAll('button')).find((b) => b.textContent!.includes('Clear selection'))!.click();
    expect(sel(g)).toEqual([]);
    expect(bulk.hidden).toBe(true);
  });

  it('select all filtered reaches records on other pages; keepSelection survives paging', () => {
    const store = new Store({ data: rows(25), pageSize: 10 });
    const g = mkGrid({ data: undefined, store, bulkActions: [{ text: 'X', handler() {} }], keepSelection: true });
    g.el.querySelector<HTMLInputElement>('.op-grid__header-row .op-grid__check')!.click();
    expect(sel(g)).toHaveLength(10);
    const more = Array.from(g.el.querySelectorAll<HTMLButtonElement>('.op-grid__bulk button')).find((b) => b.textContent!.includes('Select all 25'))!;
    expect(more.hidden).toBe(false);
    store.setPage(2);
    expect(sel(g)).toHaveLength(10); // kept
    g.selectAllFiltered();
    expect(sel(g)).toHaveLength(25);
  });

  it('without keepSelection, records that leave the view are dropped', () => {
    const store = new Store({ data: rows(25), pageSize: 10 });
    const g = mkGrid({ data: undefined, store });
    check(g, 0).click();
    store.setPage(2);
    expect(sel(g)).toEqual([]);
  });

  it('row actions open a menu whose handler receives the record', () => {
    const run = vi.fn();
    const g = mkGrid({ checkboxSelection: false, rowActions: [{ text: 'Edit', handler: run }] });
    (body(g)[1].querySelector('.op-grid__actbtn') as HTMLElement).click();
    const item = Array.from(document.querySelectorAll<HTMLElement>('.op-layer .op-menu__item')).find((i) => i.textContent!.includes('Edit'))!;
    item.click();
    expect(run.mock.calls[0][0].data.id).toBe(2);
    expect(sel(g)).toEqual([]); // opening the menu does not select the row
  });

  it("rowActionsMode 'visible': one button per action, always rendered; per-row disabled; click runs the handler without selecting", () => {
    const edit = vi.fn();
    const del = vi.fn();
    const g = mkGrid({ checkboxSelection: false, rowActionsMode: 'visible', rowActions: [{ text: 'Edit', icon: 'edit', handler: edit }, { text: 'Delete', icon: 'trash', variant: 'danger', disabled: (r: any) => r.data.id === 2, handler: del }] });
    expect(g.el.classList.contains('op-grid--actions-visible')).toBe(true);
    const btns = (i: number) => Array.from(body(g)[i].querySelectorAll('.op-grid__actbtn')) as HTMLButtonElement[];
    expect(btns(0).map((b) => b.getAttribute('aria-label'))).toEqual(['Edit', 'Delete']);
    expect(btns(1)[1].disabled).toBe(true);
    expect(btns(0)[1].disabled).toBe(false);
    btns(0)[0].click();
    expect(edit.mock.calls[0][0].data.id).toBe(1);
    btns(1)[1].click(); // disabled: nothing
    expect(del).not.toHaveBeenCalled();
    btns(2)[1].click();
    expect(del.mock.calls[0][0].data.id).toBe(3);
    expect(sel(g)).toEqual([]);
    expect(document.querySelector('.op-layer .op-menu')).toBeNull(); // no menu in visible mode
  });

  it('Shift+F10 / ContextMenu key opens the row menu for the active row (both modes)', () => {
    const run = vi.fn();
    const g = mkGrid({ checkboxSelection: false, rowActionsMode: 'visible', rowActions: [{ text: 'Edit', handler: run }] });
    g.focusRow(1);
    key(g.el, 'F10', { shiftKey: true });
    Array.from(document.querySelectorAll<HTMLElement>('.op-layer .op-menu__item')).find((i) => i.textContent === 'Edit')!.click();
    expect(run.mock.calls[0][0].data.id).toBe(2);
  });

  it('column menu toggles columns, filters by search, keeps one visible, and round-trips the state', () => {
    const g = mkGrid({ checkboxSelection: false, columnMenu: true });
    const changes = vi.fn();
    g.on('columns-change', changes);
    g.el.querySelector<HTMLElement>('.op-grid__bar > .op-button')!.click();
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('.op-grid__colitem'));
    expect(items().map((i) => i.textContent)).toEqual(['#', 'Name', 'Total']);
    const box = (n: number) => items()[n].querySelector('input')!;
    box(1).click();
    expect(Array.from(g.el.querySelectorAll('.op-grid__header-row > *')).map((c) => c.textContent)).toEqual(['#', 'Total']);
    expect(text(body(g)[0])).toEqual(['1', '$10.00']);
    expect(changes).toHaveBeenCalledTimes(1);
    const search = document.querySelector<HTMLInputElement>('.op-grid__colmenu input[type=text], .op-grid__colmenu .op-textfield__input')!;
    search.value = 'tot';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(items().filter((i) => !i.hidden).map((i) => i.textContent)).toEqual(['Total']);
    box(2).click(); // hide Total; only "#" left
    expect(box(0).disabled).toBe(true); // the last visible column cannot be hidden
    const state = g.getColumnState();
    expect(state.map((s) => [s.field, s.hidden])).toEqual([['id', false], ['name', true], ['total', true]]);
    g.setColumnState([{ field: 'total', hidden: false }, { field: 'id', hidden: false }, { field: 'name', hidden: false }]);
    expect(Array.from(g.el.querySelectorAll('.op-grid__header-row > *')).map((c) => c.textContent)).toEqual(['Total', '#', 'Name']);
    expect(text(body(g)[0])).toEqual(['$10.00', '1', 'Name 001']);
  });
});

describe('FilterBuilder', () => {
  const fields = [
    { name: 'name', label: 'Name' },
    { name: 'total', label: 'Total', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: ['open', 'paid', 'void'] },
    { name: 'day', label: 'Day', type: 'date' },
  ];
  const fb = (extra: object = {}) => {
    const f = mk<any>({ type: 'filterbuilder', fields, live: false, ...extra });
    document.body.append(f.el);
    return f;
  };
  const sel = (f: any, key: string) => f.el.querySelector(`select[data-fb="${key}"]`) as HTMLSelectElement;
  const pick = (el: HTMLSelectElement, v: string) => {
    el.value = v;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const typeIn = (el: Element, v: string) => {
    const i = el.querySelector('input')!;
    i.value = v;
    i.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const addBtn = (f: any, text: string) => Array.from(f.el.querySelectorAll('button')).find((b: any) => b.textContent.includes(text)) as HTMLElement;

  it('starts empty; adding rows accumulates them; incomplete rows are not part of the filter', () => {
    const f = fb();
    expect(f.getFilter()).toBeNull();
    addBtn(f, 'Add filter').click();
    addBtn(f, 'Add filter').click();
    expect(f.el.querySelectorAll('.op-filterbuilder__row')).toHaveLength(2);
    expect(f.getFilter()).toBeNull();
    typeIn(f.el.querySelector('[data-fb="r1:v1"]')!, 'ana');
    expect(f.getFilter()).toEqual({ op: 'and', filters: [{ field: 'name', op: 'contains', value: 'ana' }] });
  });

  it('operators change the editors: between has two, empty has none, "in" is a list', () => {
    const f = fb();
    addBtn(f, 'Add filter').click();
    pick(sel(f, 'r1:field'), 'total');
    pick(sel(f, 'r1:op'), 'between');
    expect(f.el.querySelectorAll('.op-filterbuilder__value')).toHaveLength(2);
    typeIn(f.el.querySelector('[data-fb="r1:v1"]')!, '10');
    typeIn(f.el.querySelector('[data-fb="r1:v2"]')!, '50');
    expect(f.getFilter().filters[0]).toEqual({ field: 'total', op: 'between', value: [10, 50] });
    pick(sel(f, 'r1:op'), 'empty');
    expect(f.el.querySelectorAll('.op-filterbuilder__value')).toHaveLength(0);
    expect(f.getFilter().filters[0]).toEqual({ field: 'total', op: 'empty' });
    pick(sel(f, 'r1:field'), 'name');
    pick(sel(f, 'r1:op'), 'in');
    typeIn(f.el.querySelector('[data-fb="r1:v1"]')!, 'a, b ,c');
    expect(f.getFilter().filters[0].value).toEqual(['a', 'b', 'c']);
  });

  it('OR groups nest, switching logic and removing work', () => {
    const f = fb();
    addBtn(f, 'Add group').click();
    expect(f.el.querySelectorAll('.is-nested')).toHaveLength(1);
    typeIn(f.el.querySelector('[data-fb="r1:v1"]')!, 'x');
    addBtn(f, 'Add filter').click(); // root-level row
    pick(sel(f, 'r2:field'), 'status');
    pick(sel(f, 'r2:v1'), 'paid');
    expect(f.getFilter()).toEqual({ op: 'and', filters: [{ op: 'or', filters: [{ field: 'name', op: 'contains', value: 'x' }] }, { field: 'status', op: 'eq', value: 'paid' }] });
    pick(sel(f, 'g0:logic'), 'or');
    expect(f.getFilter().op).toBe('or');
    f.el.querySelector('.is-nested .op-filterbuilder__remove')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(f.el.querySelectorAll('.is-nested')).toHaveLength(0);
    expect(f.getFilter().filters).toHaveLength(1);
  });

  it('applies to the store (Apply button), and Clear removes the filter', async () => {
    const store = new Store({ data: [{ name: 'Ana', total: 5 }, { name: 'Bob', total: 60 }, { name: 'Cid', total: 20 }] });
    const f = fb({ store });
    const applied = vi.fn();
    f.on('apply', applied);
    addBtn(f, 'Add filter').click();
    pick(sel(f, 'r1:field'), 'total');
    pick(sel(f, 'r1:op'), 'ge');
    typeIn(f.el.querySelector('[data-fb="r1:v1"]')!, '20');
    expect(store.count).toBe(3); // not live: nothing yet
    addBtn(f, 'Apply').click();
    expect(store.getData().map((r) => r.name)).toEqual(['Bob', 'Cid']);
    expect(applied).toHaveBeenCalledTimes(1);
    addBtn(f, 'Clear all').click();
    expect(store.count).toBe(3);
    expect(f.el.querySelectorAll('.op-filterbuilder__row')).toHaveLength(0);
  });

  it('live mode filters after a short debounce; setFilter restores rows', async () => {
    vi.useFakeTimers();
    const store = new Store({ data: [{ name: 'Ana' }, { name: 'Bob' }] });
    const f = fb({ store, live: true });
    f.setFilter({ op: 'and', filters: [{ field: 'name', op: 'startsWith', value: 'B' }] });
    expect(f.el.querySelectorAll('.op-filterbuilder__row')).toHaveLength(1);
    expect(sel(f, 'r1:op').value).toBe('startsWith');
    vi.advanceTimersByTime(300);
    expect(store.getData()).toEqual([{ name: 'Bob' }]);
    vi.useRealTimers();
  });

  it("addMode 'pick' asks for the field first, then adds the row for it", () => {
    const f = fb({ addMode: 'pick' });
    addBtn(f, 'Add filter').click();
    expect(f.el.querySelectorAll('.op-filterbuilder__row')).toHaveLength(0); // nothing yet: a menu of fields opened
    const items = Array.from(document.querySelectorAll<HTMLElement>('.op-layer .op-menu__item'));
    expect(items.map((i) => i.textContent)).toEqual(['Name', 'Total', 'Status', 'Day']);
    items[1].click();
    expect(f.el.querySelectorAll('.op-filterbuilder__row')).toHaveLength(1);
    expect(sel(f, 'r1:field').value).toBe('total');
    expect(sel(f, 'r1:op').value).toBe('eq');
  });

  it('fields with a group: grouped in the pick menu (searchable past 6 fields) and in <optgroup>s of the field select', () => {
    const grouped = [
      { name: 'id', label: 'Invoice', group: 'Identification' }, { name: 'who', label: 'Customer', group: 'Identification' },
      { name: 'amount', label: 'Amount', type: 'number', group: 'Values' }, { name: 'paid', label: 'Paid', type: 'number', group: 'Values' },
      { name: 'issued', label: 'Issued', type: 'date', group: 'Dates' }, { name: 'due', label: 'Due', type: 'date', group: 'Dates' }, { name: 'note', label: 'Note' },
    ];
    const f = mk<any>({ type: 'filterbuilder', fields: grouped, live: false, addMode: 'pick' });
    document.body.append(f.el);
    addBtn(f, 'Add filter').click();
    const menu = document.querySelector<HTMLElement>('.op-layer .op-menu')!;
    expect(menu.querySelector('.op-menu__search')).not.toBeNull();
    expect(Array.from(menu.querySelectorAll('.op-menu__group-label')).map((g) => g.textContent)).toEqual(['Identification', 'Values', 'Dates']);
    (menu.querySelectorAll<HTMLElement>('.op-menu__group')[1].querySelector('.op-menu__item') as HTMLElement).click();
    const s = sel(f, 'r1:field');
    expect(s.value).toBe('amount');
    expect(Array.from(s.querySelectorAll('optgroup')).map((g) => g.label)).toEqual(['Identification', 'Values', 'Dates']);
    expect(s.querySelector('option[value=note]')!.parentElement).toBe(s); // ungrouped stays at the top level
  });

  it('value editors do not reserve an error line (rows stay aligned)', () => {
    const f = fb();
    addBtn(f, 'Add filter').click();
    expect(f.el.querySelector('.op-filterbuilder__value')!.classList.contains('op-stable')).toBe(false);
    expect(f.el.querySelector('.op-filterbuilder__value')!.classList.contains('op-filterbuilder__value')).toBe(true);
  });

  it('"is any of" on a select field is a group of toggle chips (not a native multi-select)', () => {
    const f = fb();
    addBtn(f, 'Add filter').click();
    pick(sel(f, 'r1:field'), 'status');
    pick(sel(f, 'r1:op'), 'in');
    expect(f.el.querySelector('select[multiple]')).toBeNull();
    const boxes = Array.from(f.el.querySelectorAll('.op-filterbuilder__chip input')) as HTMLInputElement[];
    expect(boxes).toHaveLength(3);
    boxes[0].click();
    boxes[2].click();
    expect(f.getFilter().filters[0]).toEqual({ field: 'status', op: 'in', value: ['open', 'void'] });
    boxes[0].click();
    expect(f.getFilter().filters[0].value).toEqual(['void']);
  });

  it('keeps focus on the same control after rebuilding', () => {
    const f = fb();
    addBtn(f, 'Add filter').click();
    const op = sel(f, 'r1:op');
    op.focus();
    pick(op, 'eq');
    expect(document.activeElement).toBe(sel(f, 'r1:op'));
  });
});

describe('SearchGrid / LookupField', () => {
  const people = () => Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `Person ${String(i + 1).padStart(2, '0')}`, city: i % 2 ? 'Lisboa' : 'Porto' }));
  const def = (extra: object = {}) => ({
    store: () => new Store({ data: people(), pageSize: 10 }),
    columns: [{ field: 'id', header: '#', width: 60 }, { field: 'name', header: 'Name' }, { field: 'city', header: 'City' }],
    filters: [{ type: 'textfield', name: 'name', placeholder: 'Name' }, { type: 'select', name: 'city', options: ['Lisboa', 'Porto'] }],
    valueField: 'id',
    displayField: 'name',
    ...extra,
  });
  const wait = () => new Promise((r) => setTimeout(r, 0));

  it('SearchGrid turns the filter fields into specs and filters its own store', async () => {
    const sg = mk<any>({ type: 'searchgrid', lookup: def() });
    document.body.append(sg.el);
    await wait();
    expect(sg.getStore().totalCount).toBe(40); // autoSearch with no filters
    const input = sg.el.querySelector('.op-searchgrid__filters input') as HTMLInputElement;
    input.value = 'person 0';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(sg.getFilters()).toEqual([{ field: 'name', op: 'contains', value: 'person 0' }]);
    await sg.search();
    expect(sg.getStore().totalCount).toBe(9);
    sg.clear();
    expect(sg.getFilters()).toEqual([]);
    expect(sg.getStore().totalCount).toBe(40);
  });

  it('a filter may be a field instance (op/field in its config) and survives the SearchGrid', async () => {
    const city = new SelectField({ name: 'city', options: ['Lisboa', 'Porto'], op: 'eq', field: 'city' } as any);
    const sg = mk<any>({ type: 'searchgrid', lookup: def({ filters: [city] }) });
    document.body.append(sg.el);
    await wait();
    city.setValue('Porto');
    expect(sg.getFilters()).toEqual([{ field: 'city', op: 'eq', value: 'Porto' }]);
    sg.destroy();
    expect(city.destroyed).toBe(false);
  });

  it('two instances of a registered lookup do not share a store', () => {
    registerLookup('people', def());
    const a = mk<any>({ type: 'searchgrid', lookup: 'people' });
    const b = mk<any>({ type: 'searchgrid', lookup: 'people' });
    expect(a.getStore()).not.toBe(b.getStore());
    expect(() => create({ type: 'searchgrid', lookup: 'nope' } as any).el).toThrow(/unknown lookup/);
  });

  it('confirm fires on Enter in the grid for the selected rows', async () => {
    const sg = mk<any>({ type: 'searchgrid', lookup: def() });
    document.body.append(sg.el);
    await wait();
    const done = vi.fn();
    sg.on('confirm', done);
    sg.getGrid().select(2);
    key(sg.getGrid().el, 'Enter'); // needs an active row
    sg.getGrid().focusRow(2);
    key(sg.getGrid().el, 'Enter');
    expect(done).toHaveBeenCalledTimes(1);
    expect(done.mock.calls[0][0][0].data.id).toBe(3);
  });

  it('LookupField: the magnifier opens the window; double-click picks the record', async () => {
    const f = mk<any>({ type: 'lookupfield', lookup: def(), label: 'Person' });
    document.body.append(f.el);
    (f.el.querySelector('.op-lookup__btn') as HTMLElement).click();
    await wait();
    const win = document.querySelector('.op-window')!;
    expect(win).not.toBeNull();
    const row = win.querySelectorAll<HTMLElement>('.op-grid__body-row')[1];
    row.dispatchEvent(new MouseEvent('click', { bubbles: true })); // a double-click is a click first
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(f.getValue()).toBe(2);
    expect(f.getInput().value).toBe('Person 02');
    expect(document.querySelector('.op-window')).toBeNull();
  });

  it('LookupField: typing suggests, F4 opens the window pre-filled with the typed text', async () => {
    const f = mk<any>({ type: 'lookupfield', lookup: def(), delay: 0 });
    document.body.append(f.el);
    f.getInput().focus();
    type(f, 'person 1');
    await f.search('person 1');
    expect(document.querySelectorAll('.op-layer [role=option]').length).toBe(10);
    key(f.getInput(), 'F4');
    await wait();
    const q = document.querySelector('.op-window .op-searchgrid__filters input') as HTMLInputElement;
    expect(q.value).toBe('person 1');
    document.querySelector<HTMLElement>('.op-window .op-panel__tool')!.click(); // close
    expect(document.querySelector('.op-window')).toBeNull();
    expect(f.getValue()).toBeNull();
  });
});

describe('ViewManager (saved views)', () => {
  const mem = () => {
    const db: any[] = [];
    let n = 0;
    return {
      db,
      list: () => db.map((v) => JSON.parse(JSON.stringify(v))),
      save: (v: any) => {
        const s = { ...JSON.parse(JSON.stringify(v)), id: v.id ?? `id${++n}` };
        const i = db.findIndex((x) => x.id === s.id);
        if (i < 0) db.push(s);
        else db[i] = s;
        return s;
      },
      remove: (v: any) => void db.splice(db.findIndex((x) => x.id === v.id), 1),
    };
  };
  const setup = (storage: any, extra: object = {}) => {
    const store = new Store<any>({ data: rows(30), pageSize: 10 });
    const grid = mk<Grid>({ type: 'grid', store, columns: cols, columnMenu: true, height: 200 });
    const filters = mk<any>({ type: 'filterbuilder', fields: [{ name: 'name', label: 'Name' }, { name: 'total', type: 'number' }], store, live: false });
    const vm = mk<any>({ type: 'viewmanager', grid, filters, storage, ...extra });
    document.body.append(vm.el);
    return { store, grid, filters, vm };
  };
  const wait = () => new Promise((r) => setTimeout(r, 0));
  const flt = { op: 'and' as const, filters: [{ field: 'total', op: 'ge' as const, value: 200 }] };

  it('saves columns, filter and sort under a name, and applies them back', async () => {
    const storage = mem();
    const { store, grid, filters, vm } = setup(storage);
    grid.setColumnState([{ field: 'total', hidden: false }, { field: 'id', hidden: false }, { field: 'name', hidden: true }]);
    store.sort('total', 'desc');
    filters.setFilter(flt);
    await vm.saveAs('Big ones');
    expect(storage.db).toHaveLength(1);
    expect(storage.db[0].state.columns.map((c: any) => [c.field, c.hidden])).toEqual([['total', false], ['id', false], ['name', true]]);
    expect(storage.db[0].state.filter).toEqual(flt);
    expect(storage.db[0].state.sorters).toEqual([{ field: 'total', dir: 'desc' }]);
    expect(vm.getCurrent().name).toBe('Big ones');
    expect(vm.el.textContent).toContain('Big ones');

    vm.reset(); // back to the initial setup
    expect(store.totalCount).toBe(30);
    expect(grid.getColumnState().map((c) => c.field)).toEqual(['id', 'name', 'total']);
    expect(store.getSorters()).toEqual([]);

    vm.apply(vm.getViews()[0]);
    expect(grid.getColumnState().map((c) => [c.field, c.hidden])).toEqual([['total', false], ['id', false], ['name', true]]);
    expect(store.totalCount).toBe(11); // total >= 200 → 11 rows (200..300)
    expect(store.getSorters()).toEqual([{ field: 'total', dir: 'desc' }]);
    expect(filters.getFilter()).toEqual(flt);
  });

  it('save() updates the active view in place; saveAs() with an existing name overwrites it', async () => {
    const storage = mem();
    const { filters, vm } = setup(storage);
    await vm.saveAs('A');
    filters.setFilter(flt);
    await vm.save();
    expect(storage.db).toHaveLength(1);
    expect(storage.db[0].state.filter).toEqual(flt);
    await vm.saveAs('a');
    expect(storage.db).toHaveLength(1);
    await vm.saveAs('B');
    expect(storage.db).toHaveLength(2);
  });

  it('opens with the default view; setDefault moves the mark', async () => {
    const storage = mem();
    storage.save({ name: 'One', default: true, state: { filter: flt } });
    storage.save({ name: 'Two', state: {} });
    const { store, vm } = setup(storage);
    await wait();
    expect(vm.getCurrent().name).toBe('One');
    expect(store.totalCount).toBe(11);
    vm.apply(vm.getViews()[1]);
    await vm.setDefault();
    expect(storage.db.map((v) => [v.name, !!v.default])).toEqual([['One', false], ['Two', true]]);
  });

  it('extra state rides along', async () => {
    const storage = mem();
    let density = 'comfortable';
    const { vm } = setup(storage, { extra: { density: { get: () => density, set: (v: string) => (density = v) } } });
    density = 'compact';
    await vm.saveAs('Dense');
    density = 'comfortable';
    vm.apply(vm.getViews()[0]);
    expect(density).toBe('compact');
  });

  it('the menu lists views and runs actions; delete asks first', async () => {
    const storage = mem();
    storage.save({ name: 'One', state: {} });
    const { vm } = setup(storage);
    await wait();
    (vm.el.querySelector('button') as HTMLElement).click();
    const items = () => Array.from(document.querySelectorAll<HTMLElement>('.op-layer .op-menu__item'));
    expect(items().map((i) => i.textContent)).toEqual(['One', 'Save view', 'Save as new view…', 'Reset to initial']);
    items()[0].click();
    expect(vm.getCurrent().name).toBe('One');
    (vm.el.querySelector('button') as HTMLElement).click();
    items().find((i) => i.textContent === 'Delete view')!.click();
    await wait();
    document.querySelector<HTMLElement>('.op-messagebox .op-button--danger, .op-window .op-button--danger')!.click();
    await wait();
    expect(storage.db).toHaveLength(0);
    expect(vm.getCurrent()).toBeUndefined();
  });

  it('storage errors become an `error` event, not an exception', async () => {
    const { vm } = setup({ list: () => [], save: () => Promise.reject(new Error('offline')), remove() {} });
    const err = vi.fn();
    vm.on('error', err);
    await vm.saveAs('X');
    expect(err).toHaveBeenCalledTimes(1);
    expect(vm.getViews()).toEqual([]);
  });

  it('localViewStorage round-trips and survives corrupt data; restViewStorage maps verbs to URLs', async () => {
    const fake: Storage = (() => {
      const m = new Map<string, string>();
      return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as unknown as Storage;
    })();
    const ls = localViewStorage('k', fake);
    const a = (await ls.save({ name: 'A', state: {} })) as any;
    expect(a.id).toBeTruthy();
    await ls.save({ ...a, name: 'A2' });
    expect((await ls.list()).map((v) => v.name)).toEqual(['A2']);
    await ls.remove(a);
    expect(await ls.list()).toEqual([]);
    fake.setItem('k', '{broken');
    expect(await ls.list()).toEqual([]);

    const calls: string[] = [];
    const rs = restViewStorage({ url: '/api/views', headers: { Authorization: 'x' }, fetch: (async (u: string, o: any) => (calls.push(`${o.method} ${u}`), Response.json(o.method === 'GET' ? [{ name: 'S', state: {} }] : { id: '7', name: 'S', state: {} }))) as any });
    expect(await rs.list()).toHaveLength(1);
    expect(((await rs.save({ name: 'S', state: {} })) as any).id).toBe('7');
    await rs.save({ id: '7', name: 'S', state: {} });
    await rs.remove({ id: '7', name: 'S', state: {} });
    expect(calls).toEqual(['GET /api/views', 'POST /api/views', 'PUT /api/views/7', 'DELETE /api/views/7']);
  });
});

describe('Grid: reorderable columns', () => {
  const mkG = (extra: object = {}) => {
    const g = mk<Grid>({ type: 'grid', data: rows(3), columns: [{ field: 'id', header: '#', sortable: true }, { field: 'name', header: 'Name' }, { field: 'total', header: 'Total', sortable: true }, { field: 'on', header: 'On', hidden: true }], reorderableColumns: true, height: 200, rowHeight: 30, ...extra });
    document.body.append(g.el);
    return g;
  };
  const heads = (g: Grid) => Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__hcell'));
  const order = (g: Grid) => heads(g).map((c) => c.dataset.field);
  /** Cells 100px wide, side by side (layout does not exist in happy-dom). */
  const layout = (g: Grid) => heads(g).forEach((c, i) => (c.getBoundingClientRect = () => ({ left: i * 100, right: i * 100 + 100, top: 0, bottom: 30, width: 100, height: 30, x: i * 100, y: 0, toJSON() {} }) as DOMRect));
  const ptr = (el: EventTarget, type: string, x: number, y = 10) => el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, button: 0 }));

  it('is off by default: no marks, nothing moves', () => {
    const g = mkG({ reorderableColumns: false });
    layout(g);
    ptr(heads(g)[0], 'pointerdown', 50);
    ptr(document, 'pointermove', 290);
    ptr(document, 'pointerup', 290);
    expect(order(g)).toEqual(['id', 'name', 'total']);
    expect(g.el.querySelector('.is-reorderable')).toBeNull();
  });

  it('dragging a header to the end moves its column; a ghost and a drop bar show meanwhile; hidden columns stay put', () => {
    const g = mkG();
    const moved = vi.fn();
    const changed = vi.fn();
    g.on('column-move', moved);
    g.on('columns-change', changed);
    layout(g);
    ptr(heads(g)[0], 'pointerdown', 50);
    ptr(document, 'pointermove', 52); // under the threshold: still a click
    expect(g.el.querySelector('.op-grid__ghost')).toBeNull();
    ptr(document, 'pointermove', 290);
    expect(g.el.querySelector('.op-grid__ghost')!.textContent).toBe('#');
    expect((g.el.querySelector('.op-grid__drop') as HTMLElement).style.left).toBe('300px');
    expect(heads(g)[0].classList.contains('is-dragging-col')).toBe(true);
    ptr(document, 'pointerup', 290);
    expect(order(g)).toEqual(['name', 'total', 'id']);
    expect(g.getColumnState().map((c) => c.field)).toEqual(['name', 'total', 'id', 'on']);
    expect(g.getColumnState().find((c) => c.field === 'on')!.hidden).toBe(true);
    expect(moved).toHaveBeenCalledWith('id', 0, 2);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(g.el.querySelector('.op-grid__ghost')).toBeNull();
    expect(g.el.querySelector('.op-grid__drop')).toBeNull();
  });

  it('drop between columns, and a drag that ends where it started does nothing', () => {
    const g = mkG();
    layout(g);
    ptr(heads(g)[2], 'pointerdown', 250);
    ptr(document, 'pointermove', 120); // before the middle of "name"? no: past it, so it lands before "total"... start from total to before name
    ptr(document, 'pointermove', 60);
    ptr(document, 'pointerup', 60);
    expect(order(g)).toEqual(['id', 'total', 'name']);
    const g2 = mkG();
    layout(g2);
    const before = order(g2);
    ptr(heads(g2)[1], 'pointerdown', 150);
    ptr(document, 'pointermove', 160);
    ptr(document, 'pointermove', 170);
    ptr(document, 'pointerup', 170);
    expect(order(g2)).toEqual(before);
  });

  it('a drag does not count as a click (no sorting), a plain click still sorts', () => {
    const g = mkG();
    layout(g);
    const btn = heads(g)[0].querySelector('button')!;
    ptr(btn, 'pointerdown', 50);
    ptr(document, 'pointermove', 290);
    ptr(document, 'pointerup', 290);
    btn.click(); // the click the browser fires after the drag
    expect(g.getStore().getSorters()).toEqual([]);
    return new Promise((r) => setTimeout(r, 5)).then(() => {
      heads(g).find((c) => c.dataset.field === 'id')!.querySelector('button')!.click();
      expect(g.getStore().getSorters()).toEqual([{ field: 'id', dir: 'asc' }]);
    });
  });

  it('keyboard: Alt+→ / Alt+← move a focused header one step and keep the focus', () => {
    const g = mkG();
    const btn = () => heads(g)[0].querySelector('button')!;
    btn().focus();
    btn().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
    expect(order(g)).toEqual(['name', 'id', 'total']);
    expect(document.activeElement).toBe(heads(g)[1].querySelector('button'));
    heads(g)[1].querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true, cancelable: true }));
    expect(order(g)).toEqual(['id', 'name', 'total']);
    heads(g)[0].querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', altKey: true, bubbles: true, cancelable: true }));
    expect(order(g)).toEqual(['id', 'name', 'total']); // already first
    expect(heads(g)[1].tabIndex).toBe(0); // a non-sortable header is focusable so it can be moved
  });

  it('the selection and actions columns are never draggable', () => {
    const g = mkG({ checkboxSelection: true });
    expect(heads(g)[0].classList.contains('is-reorderable')).toBe(false);
    expect(heads(g).filter((c) => c.classList.contains('is-reorderable'))).toHaveLength(3);
  });
});

describe('Grid: resizable columns', () => {
  const mkR = (extra: object = {}) => {
    const g = mk<Grid>({ type: 'grid', data: rows(3), resizableColumns: true, height: 200, rowHeight: 30, columns: [{ field: 'id', header: '#', width: 100, sortable: true }, { field: 'name', header: 'Name', minWidth: 60, maxWidth: 300 }, { field: 'total', header: 'Total', resizable: false, width: 90 }], ...extra });
    document.body.append(g.el);
    return g;
  };
  const cell = (g: Grid, f: string) => g.el.querySelector<HTMLElement>(`.op-grid__hcell[data-field="${f}"]`)!;
  const grip = (g: Grid, f: string) => cell(g, f).querySelector<HTMLElement>('.op-grid__resizer')!;
  const ptr = (el: EventTarget, type: string, x: number) => el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: 5, bubbles: true, cancelable: true, button: 0 }));
  const cols = (g: Grid) => g.el.style.getPropertyValue('--op-grid-cols');
  const width = (g: Grid, f: string) => g.getColumnState().find((c) => c.field === f)!.width;

  it('handles only on resizable columns, only with the flag', () => {
    const g = mkR();
    expect(grip(g, 'id')).not.toBeNull();
    expect(grip(g, 'name')).not.toBeNull();
    expect(grip(g, 'total')).toBeNull(); // resizable: false
    expect(grip(g, 'id').getAttribute('aria-label')).toBe('Resize column #');
    const off = mkR({ resizableColumns: false });
    expect(off.el.querySelector('.op-grid__resizer')).toBeNull();
  });

  it('dragging changes the width live, clamps to min/max, and emits once at the end', () => {
    const g = mkR();
    const resized = vi.fn();
    const changed = vi.fn();
    g.on('column-resize', resized);
    g.on('columns-change', changed);
    cell(g, 'id').getBoundingClientRect = () => ({ width: 100 }) as DOMRect;
    ptr(grip(g, 'id'), 'pointerdown', 100);
    ptr(document, 'pointermove', 160);
    expect(cols(g).startsWith('160px')).toBe(true);
    expect(g.el.classList.contains('is-resizing')).toBe(true);
    expect(resized).not.toHaveBeenCalled();
    ptr(document, 'pointermove', 100 - 500); // far left: min 48
    expect(width(g, 'id')).toBe(48);
    ptr(document, 'pointerup', 0);
    expect(resized).toHaveBeenCalledWith('id', 48);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(g.el.classList.contains('is-resizing')).toBe(false);
    // max
    cell(g, 'name').getBoundingClientRect = () => ({ width: 200 }) as DOMRect;
    ptr(grip(g, 'name'), 'pointerdown', 0);
    ptr(document, 'pointermove', 900);
    ptr(document, 'pointerup', 0);
    expect(width(g, 'name')).toBe(300);
  });

  it('a flexible column starts from the width it shows and becomes fixed; double-click gives the flexibility back', () => {
    const g = mkR();
    expect(width(g, 'name')).toBeUndefined();
    cell(g, 'name').getBoundingClientRect = () => ({ width: 240 }) as DOMRect;
    ptr(grip(g, 'name'), 'pointerdown', 10);
    ptr(document, 'pointermove', 40);
    ptr(document, 'pointerup', 40);
    expect(width(g, 'name')).toBe(270);
    grip(g, 'name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(width(g, 'name')).toBeUndefined();
    expect(cols(g)).toContain('minmax(60px');
  });

  it('a resize is not a click (no sorting) and does not start a column drag', () => {
    const g = mkR({ reorderableColumns: true });
    cell(g, 'id').getBoundingClientRect = () => ({ width: 100 }) as DOMRect;
    ptr(grip(g, 'id'), 'pointerdown', 100);
    ptr(document, 'pointermove', 140);
    ptr(document, 'pointerup', 140);
    grip(g, 'id').click();
    expect(g.getStore().getSorters()).toEqual([]);
    expect(g.el.querySelector('.op-grid__ghost')).toBeNull();
    expect(g.getColumnState().map((c) => c.field)).toEqual(['id', 'name', 'total']);
  });

  it('keyboard: Alt+Shift+→/← on a focused header, via setColumnWidth; the width goes into the column state', () => {
    const g = mkR();
    cell(g, 'id').getBoundingClientRect = () => ({ width: 100 }) as DOMRect;
    cell(g, 'id').querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, shiftKey: true, bubbles: true, cancelable: true }));
    expect(width(g, 'id')).toBe(116);
    g.setColumnWidth('id', 20);
    expect(width(g, 'id')).toBe(48);
    g.setColumnState([{ field: 'id', hidden: false, width: 200 }, { field: 'name', hidden: false }, { field: 'total', hidden: false, width: 90 }]);
    expect(cols(g).startsWith('200px')).toBe(true);
    expect(cell(g, 'name').tabIndex).toBe(0); // a non-sortable header is focusable so it can be resized
  });

  it('Alt+arrows (no Shift) still reorder, not resize', () => {
    const g = mkR({ reorderableColumns: true });
    cell(g, 'id').querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true, cancelable: true }));
    expect(g.getColumnState().map((c) => c.field)).toEqual(['name', 'id', 'total']);
    expect(width(g, 'id')).toBe(100);
  });
});

describe('Grid: column groups', () => {
  const gcols = [
    { field: 'id', header: '#', group: 'Identification' }, { field: 'name', header: 'Name', group: 'Identification' },
    { field: 'total', header: 'Total', group: 'Values' }, { field: 'on', header: 'On', group: 'Values' }, { field: 'x', header: 'Loose' },
  ];
  const mkGrp = (extra: object = {}) => {
    const g = mk<Grid>({ type: 'grid', data: rows(2), columns: gcols.map((c) => ({ ...c })), columnMenu: true, height: 200, rowHeight: 30, ...extra });
    document.body.append(g.el);
    return g;
  };
  const open = (g: Grid) => (g.el.querySelector('.op-grid__bar > .op-button') as HTMLElement).click();
  const heads = (g: Grid) => Array.from(g.el.querySelectorAll('.op-grid__hcell')).map((c) => (c as HTMLElement).dataset.field);
  const items = () => Array.from(document.querySelectorAll<HTMLElement>('.op-grid__colitem')).filter((i) => !i.hidden).map((i) => i.textContent);
  const groupBox = (name: string) => document.querySelector<HTMLInputElement>(`input[data-group-toggle="${name}"]`)!;

  it('a band over the header labels runs of neighbouring columns, with spans', () => {
    const g = mkGrp();
    const cells = Array.from(g.el.querySelectorAll<HTMLElement>('.op-grid__gcell'));
    expect(cells.map((c) => [c.textContent, c.style.gridColumn, c.classList.contains('is-empty')])).toEqual([['Identification', 'span 2', false], ['Values', 'span 2', false], ['', 'span 1', true]]);
    expect(cells[0].getAttribute('aria-colspan')).toBe('2');
    g.setColumns([...g.getColumnState().map((s) => gcols.find((c) => c.field === s.field)!)].reverse().map((c) => ({ ...c })));
    expect(Array.from(g.el.querySelectorAll('.op-grid__gcell')).map((c) => c.textContent)).toEqual(['', 'Values', 'Identification']);
  });

  it('no band without groups, or with groupHeaders: false', () => {
    const plain = mk<Grid>({ type: 'grid', data: rows(1), columns: cols, height: 100, rowHeight: 30 });
    document.body.append(plain.el);
    expect(plain.el.querySelector('.op-grid__gcell')).toBeNull();
    expect(mkGrp({ groupHeaders: false }).el.querySelector('.op-grid__gcell')).toBeNull();
  });

  it('the column menu has a section per group (and "Other"), with counts and a group checkbox', () => {
    const g = mkGrp();
    open(g);
    expect(Array.from(document.querySelectorAll('.op-grid__colgroup')).map((h) => h.textContent)).toEqual(['Identification2/2', 'Values2/2', 'Other1/1']);
    expect(g.getColumnGroups()).toEqual(['Identification', 'Values']);
  });

  it('the group checkbox hides/shows the whole group, is indeterminate when partial, and one column always stays', () => {
    const g = mkGrp();
    const changed = vi.fn();
    g.on('columns-change', changed);
    open(g);
    groupBox('Values').click();
    expect(heads(g)).toEqual(['id', 'name', 'x']);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(groupBox('Values').checked).toBe(false);
    document.querySelector<HTMLInputElement>('.op-grid__colitem input[value="on"]')!.click();
    expect(groupBox('Values').indeterminate).toBe(true);
    groupBox('Values').click(); // partial → checked = true
    expect(heads(g)).toContain('total');
    g.setColumnGroupVisible('Identification', false);
    g.setColumnGroupVisible('Values', false);
    g.setColumnGroupVisible('', false);
    expect(heads(g).length).toBeGreaterThanOrEqual(1);
  });

  it('chips filter the list by group; searching a group name shows the whole group; empty groups disappear', () => {
    const g = mkGrp();
    open(g);
    const chips = () => Array.from(document.querySelectorAll<HTMLElement>('.op-grid__colchip'));
    expect(chips().map((c) => c.textContent)).toEqual(['All', 'Identification', 'Values']);
    chips()[2].click();
    expect(items()).toEqual(['Total', 'On']);
    expect(Array.from(document.querySelectorAll<HTMLElement>('.op-grid__colgroup')).filter((h) => !h.hidden).map((h) => h.dataset.group)).toEqual(['Values']);
    chips()[0].click();
    const search = document.querySelector('.op-grid__colmenu .op-textfield__input') as HTMLInputElement;
    search.value = 'ident';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(items()).toEqual(['#', 'Name']); // matched the group's name, not the columns'
    search.value = 'loo';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(items()).toEqual(['Loose']);
  });

  it('a grid without groups keeps the flat list and no chips', () => {
    const g = mk<Grid>({ type: 'grid', data: rows(1), columns: cols, columnMenu: true, height: 100, rowHeight: 30 });
    document.body.append(g.el);
    open(g);
    expect(document.querySelector('.op-grid__colgroup')).toBeNull();
    expect((document.querySelector('.op-grid__colchips') as HTMLElement).hidden).toBe(true);
  });
});

describe('Grid<T> typing', () => {
  interface Order { id: number; customer: string; total: number }
  it('infers the record type from a typed Store: selection, store, actions and renderers are typed', () => {
    const store = new Store<Order>({ data: [{ id: 1, customer: 'Ada', total: 10 }] });
    const g = new Grid({
      store,
      columns: [{ field: 'customer' }, { field: 'total', renderer: (_v, rec) => { expectTypeOf(rec.data).toEqualTypeOf<Order>(); return String(rec.data.total); } }],
      bulkActions: [{ text: 'Archive', handler: (recs, grid) => { expectTypeOf(recs).toEqualTypeOf<Model<Order>[]>(); expectTypeOf(grid).toEqualTypeOf<Grid<Order>>(); } }],
      rowActions: [{ text: 'Open', disabled: (rec) => rec.data.total > 100, handler: (rec) => expectTypeOf(rec.data.customer).toBeString() }],
    });
    expectTypeOf(g).toEqualTypeOf<Grid<Order>>();
    expectTypeOf(g.getSelection()).toEqualTypeOf<Model<Order>[]>();
    expectTypeOf(g.getStore()).toEqualTypeOf<Store<Order>>();
    store.remove(g.getSelection()); // compiled before only with Store<any>
    expect(g.getStore()).toBe(store);
  });

  it('stays loose without a typed store, and any Store can be swapped in', () => {
    const g = create<Grid>({ type: 'grid', columns: [{ field: 'x' }] });
    expectTypeOf<ReturnType<typeof g.getSelection>[number]['data']>().toBeAny();
    g.setStore(new Store<{ name: string }>({ data: [] }));
  });
});

describe('Grid plugin: cellEditing', () => {
  const setup = (extra: object = {}) => {
    const store = new Store({ data: rows(5) });
    const g = mk<Grid>({
      type: 'grid', store, height: 300, plugins: [cellEditing()],
      columns: [{ field: 'id', header: '#' }, { field: 'name', header: 'Name', editor: { type: 'textfield', required: true } }, { field: 'total', header: 'Total', editor: true }],
      ...extra,
    });
    const events: unknown[][] = [];
    for (const e of ['edit', 'edit-cancel']) g.on(e, (...a: unknown[]) => events.push([e, ...a]));
    return { g, store, events, cell: (i: number, f: string) => g.getCell(i, f)!, table: g.el.querySelector<HTMLElement>('[role=grid]')! };
  };
  const dbl = (el: Element) => el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  const input = (el: Element) => el.querySelector<HTMLInputElement>('input')!;
  const typeIn = (i: HTMLInputElement, v: string) => {
    i.value = v;
    i.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('a double click opens an editor with the value; Enter writes it to the record and fires edit', () => {
    const { store, events, cell } = setup();
    dbl(cell(1, 'name'));
    const i = input(cell(1, 'name'));
    expect(i.value).toBe('Name 002');
    expect(document.activeElement).toBe(i);
    typeIn(i, 'Ada');
    key(i, 'Enter');
    expect(store.getAt(1)!.get('name')).toBe('Ada');
    expect(store.getAt(1)!.isDirty()).toBe(true);
    expect(cell(1, 'name').textContent).toBe('Ada');
    expect(events[0]).toEqual(['edit', store.getAt(1), 'name', 'Ada', 'Name 002']);
  });

  it('Esc cancels; an invalid value keeps the editor open; numbers get a number field', () => {
    const { store, events, cell } = setup();
    dbl(cell(0, 'name'));
    key(input(cell(0, 'name')), 'Escape');
    expect(cell(0, 'name').textContent).toBe('Name 001');
    expect(events[0][0]).toBe('edit-cancel');
    dbl(cell(0, 'name'));
    typeIn(input(cell(0, 'name')), '');
    key(input(cell(0, 'name')), 'Enter');
    expect(cell(0, 'name').querySelector('.op-grid__editor')).not.toBeNull(); // still editing: required
    key(input(cell(0, 'name')), 'Escape');
    dbl(cell(0, 'total'));
    expect(cell(0, 'total').querySelector('.op-numberfield, [role=spinbutton]')).not.toBeNull();
    typeIn(input(cell(0, 'total')), '42');
    key(input(cell(0, 'total')), 'Enter');
    expect(store.getAt(0)!.get('total')).toBe(42);
  });

  it('F2 edits the active row; Tab goes to the next editable cell, across rows', () => {
    const { g, cell, table } = setup();
    g.focusRow(2);
    key(table, 'F2');
    expect(document.activeElement).toBe(input(cell(2, 'name')));
    key(input(cell(2, 'name')), 'Tab');
    expect(document.activeElement).toBe(input(cell(2, 'total')));
    key(input(cell(2, 'total')), 'Tab');
    expect(document.activeElement).toBe(input(cell(3, 'name')));
  });

  it('before-edit and editable(record) can refuse; columns without editor never edit', () => {
    const { g, cell } = setup({ columns: [{ field: 'id', header: '#' }, { field: 'name', editor: true, editable: (r: Model) => r.get('id') !== 1 }] });
    dbl(cell(0, 'name'));
    expect(cell(0, 'name').querySelector('input')).toBeNull();
    dbl(cell(0, 'id'));
    expect(cell(0, 'id').querySelector('input')).toBeNull();
    g.on('before-edit', () => false);
    dbl(cell(1, 'name'));
    expect(cell(1, 'name').querySelector('input')).toBeNull();
  });
});
