import { describe, it, expect, afterEach } from 'vitest';
import { create, Grid, Store, columnTotals } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const rows = [
  { id: 1, name: 'Ana', qty: 2, due: '2026-03-01', city: 'Rio' },
  { id: 2, name: 'Bia', qty: 5, due: '2026-01-15', city: 'Rio' },
  { id: 3, name: 'Cris', qty: 8, due: '2026-02-10', city: 'Sao Paulo' },
];
const mk = (opts = {}, cfg = {}) => {
  const store = new Store<any>({ data: rows });
  const g = create<Grid>({
    type: 'grid', renderTo: document.body, store, plugins: [columnTotals(opts)],
    columns: [{ field: 'name', header: 'Name' }, { field: 'qty', header: 'Qty', align: 'right' }, { field: 'due', header: 'Due' }, { field: 'city', header: 'City' }],
    ...cfg,
  } as any);
  return { g, store };
};
const btn = (g: Grid, field: string) => g.el.querySelector<HTMLElement>(`.op-grid__hcell[data-field="${field}"] .op-columntotals__btn`)!;
const bar = (g: Grid) => g.el.querySelector<HTMLElement>('.op-columntotals')!;
const choose = (text: string) => [...document.querySelectorAll<HTMLElement>('.op-menu__item')].find((i) => i.textContent!.includes(text))!.click();

describe('columnTotals', () => {
  it('a button on every header; the bar stays hidden until a total is chosen', () => {
    const { g } = mk();
    expect(g.el.querySelectorAll('.op-columntotals__btn')).toHaveLength(4);
    expect(bar(g).hidden).toBe(true);
  });

  it('offers what fits the column: numbers everything, dates earliest/latest, text only count', () => {
    const { g } = mk();
    const items = () => [...document.querySelectorAll('.op-menu__item')].map((i) => i.textContent);
    btn(g, 'qty').click();
    expect(items().join()).toMatch(/Sum.*Average.*Minimum.*Maximum.*Count/);
    document.body.click();
    btn(g, 'due').click();
    expect(items().join()).toMatch(/Earliest.*Latest.*Count/);
    expect(items().join()).not.toContain('Sum');
  });

  it('choosing sum shows the total over the filtered rows and follows the filter', async () => {
    const { g, store } = mk();
    btn(g, 'qty').click();
    choose('Sum');
    expect(bar(g).hidden).toBe(false);
    expect(bar(g).textContent).toContain('15');
    await store.filter([{ field: 'city', op: 'eq', value: 'Rio' }]);
    expect(bar(g).textContent).toContain('7');
  });

  it('choosing the active one again clears it; a date shows the latest as written', () => {
    const { g } = mk();
    btn(g, 'qty').click();
    choose('Average');
    expect(bar(g).textContent).toContain('5');
    btn(g, 'qty').click();
    choose('Average');
    expect(bar(g).hidden).toBe(true);
    btn(g, 'due').click();
    choose('Latest');
    expect(bar(g).textContent).toContain('2026-03-01');
  });

  it('starts from the column summary and runs your own operation', () => {
    const { g } = mk({ operations: [{ text: 'Spread', run: (v: number[]) => Math.max(...v) - Math.min(...v) }] }, {
      columns: [{ field: 'qty', header: 'Qty', summary: 'sum' }, { field: 'name', header: 'Name' }],
    });
    expect(bar(g).textContent).toContain('15');
    btn(g, 'qty').click();
    choose('Spread');
    expect(bar(g).textContent).toContain('6');
  });

  it('clicking the button does not sort the column', () => {
    const { g } = mk({}, { columns: [{ field: 'qty', header: 'Qty', sortable: true }] });
    let sorted = false;
    g.on('sort', () => (sorted = true));
    btn(g, 'qty').click();
    expect(sorted).toBe(false);
  });

  it('destroy removes the bar', () => {
    const { g } = mk();
    g.destroy();
    expect(document.querySelector('.op-columntotals')).toBeNull();
  });

  it("show: 'modal' answers in a dialog and leaves the grid alone", async () => {
    const { g } = mk({ show: 'modal' });
    btn(g, 'qty').click();
    expect([...document.querySelectorAll('.op-menu__item')].some((i) => i.textContent!.includes('No total'))).toBe(false);
    choose('Sum');
    await new Promise((r) => setTimeout(r, 0));
    const dialog = document.querySelector('.op-messagebox, .op-window')!;
    expect(dialog.textContent).toContain('Sum of Qty: 15');
    expect(dialog.textContent).toContain('3 rows');
    expect(bar(g).hidden).toBe(true);
    expect(g.getColumns()[1].summary).toBeUndefined();
  });

  it("show: 'toast' answers in a notice", () => {
    const { g } = mk({ show: 'toast' });
    btn(g, 'qty').click();
    choose('Average');
    expect(document.body.textContent).toContain('Average of Qty: 5');
  });

  it('a duration column (minutes) reads as hours in the total', () => {
    const { g } = mk({}, { columns: [{ field: 'qty', header: 'Time', format: 'duration', align: 'right' }] });
    btn(g, 'qty').click();
    choose('Sum');
    expect(bar(g).textContent).toMatch(/15m/);
    expect(bar(g).textContent).toMatch(/Sum/);
    g.destroy();
    const d = mk({ show: 'toast' }, { columns: [{ field: 'qty', header: 'Time', format: 'duration' }] });
    btn(d.g, 'qty').click();
    choose('Sum');
    expect(document.body.textContent).toMatch(/Sum of Time: 15m/);
  });

  it("position: 'top' puts the bar under the header, as a row of the grid", () => {
    const { g } = mk({ position: 'top' }, { columns: [{ field: 'qty', header: 'Qty', summary: 'sum' }] });
    expect(bar(g).previousElementSibling?.classList.contains('op-grid__header')).toBe(true);
    expect(bar(g).getAttribute('role')).toBe('row');
    expect(bar(g).classList.contains('op-columntotals--top')).toBe(true);
  });
});
