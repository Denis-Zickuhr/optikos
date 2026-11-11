import { describe, it, expect } from 'vitest';
import { buildColumns, buildFields, buildFilterFields, buildGrid, buildForm, type FieldSpec } from 'optikos/build';
import { Store, Grid, Form, FieldSet, grouping } from 'optikos';

const specs: FieldSpec[] = [
  { name: 'unitPrice', type: 'money', summary: 'sum', required: true },
  { name: 'name', label: 'Customer', required: true },
  { name: 'status', type: 'select', options: ['open', 'paid'], group: 'State' },
  { name: 'active', type: 'bool', group: 'State' },
  { name: 'note', type: 'area', hide: ['grid', 'filter'] },
  { name: 'id', hide: ['form'], readonly: true },
];

describe('build', () => {
  it('columns: label from the name, alignment and format by type, hidden ones left out', () => {
    const cols = buildColumns(specs);
    expect(cols.map((c) => c.field)).toEqual(['unitPrice', 'name', 'status', 'active', 'id']);
    expect(cols[0]).toMatchObject({ header: 'Unit price', format: 'money', align: 'right', summary: 'sum' });
    expect(cols[1].header).toBe('Customer');
    expect(cols[3]).toMatchObject({ format: 'bool', align: 'center', group: 'State' });
  });

  it('filter fields: types follow the spec, bool becomes a Yes/No choice', () => {
    const f = buildFilterFields(specs);
    expect(f.map((x) => [x.name, x.type])).toEqual([['unitPrice', 'number'], ['name', 'text'], ['status', 'select'], ['active', 'select'], ['id', 'text']]);
    expect(f[3].options).toHaveLength(2);
  });

  it('form fields: the right field per type, overrides win', () => {
    const fields = buildFields([...specs, { name: 'mail', type: 'email', field: { required: true } }]);
    expect(fields.map((x) => (x as any).name)).toEqual(['unitPrice', 'name', 'status', 'active', 'note', 'mail']);
    expect((fields[0] as any).config.decimals).toBe(2);
    expect((fields[4] as any).config.colspan).toBe('full');
    expect((fields[5] as any).config.required).toBe(true);
  });

  it('buildGrid and buildForm return instances that mount', () => {
    const grid = buildGrid(specs, { store: new Store({ data: [{ unitPrice: 5, name: 'A', status: 'open', active: true, id: 1 }] }) });
    expect(grid).toBeInstanceOf(Grid);
    grid.mount(document.body);
    const form = buildForm(specs);
    expect(form).toBeInstanceOf(Form);
    expect(form.items.some((i) => i instanceof FieldSet)).toBe(true);
    form.mount(document.body);
    expect(form.getFields().map((f) => f.name)).toEqual(['unitPrice', 'name', 'status', 'active', 'note']);
    expect(form.validate()).toBe(false);
  });

  it('a grand total without grouping sums what the filter left', async () => {
    const store = new Store<any>({ data: [{ unitPrice: 5, name: 'A' }, { unitPrice: 7, name: 'B' }] });
    const grid = buildGrid(specs.slice(0, 2), { store, plugins: [grouping({ summary: 'grand' })] });
    grid.mount(document.body);
    await store.filter([{ field: 'name', op: 'eq', value: 'B' }]);
    expect(grid.el.querySelector('.is-grand-total')?.textContent).toContain('7');
  });

  it('summaries: numbers add up, dates give the earliest and the latest, a function does anything', async () => {
    const store = new Store<any>({ data: [{ n: 2, d: '2024-03-01', c: 'a' }, { n: 5, d: '2024-01-15', c: 'b' }] });
    const cols = buildColumns([
      { name: 'n', type: 'number', summary: 'sum' },
      { name: 'd', type: 'date', summary: 'min' },
      { name: 'c', summary: (v) => v.join('+') },
    ]);
    const grid = new Grid({ columns: cols, store, plugins: [grouping({ summary: 'grand' })] });
    grid.mount(document.body);
    const cells = [...grid.el.querySelectorAll('.is-grand-total .op-grid__cell')].map((c) => c.textContent);
    expect(cells.join('|')).toContain('7');
    expect(cells.join('|')).toContain('a+b');
    expect(grid.el.querySelector('.is-grand-total')?.textContent).toMatch(/15.*2024|2024.*15/);
  });
});
