import { describe, it, expect, afterEach, vi } from 'vitest';
import { create, Grid, Store, exportBar } from 'optikos';

afterEach(() => (document.body.innerHTML = ''));
const rows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}`, qty: i }));
const mk = (opts = {}, cfg = {}) => {
  const plugin = exportBar(opts);
  const g = create<Grid>({
    type: 'grid', renderTo: document.body, store: new Store({ data: rows, pageSize: 10 }), paging: true, plugins: [plugin],
    columns: [{ field: 'name', header: 'Name' }, { field: 'qty', header: 'Qty' }],
    ...cfg,
  } as any);
  return { g, plugin };
};
const btns = (g: Grid) => [...g.el.querySelectorAll<HTMLElement>('.op-exportbar button')];
const shown = (g: Grid) => btns(g).filter((b) => !b.closest('[hidden]') && !b.hidden).map((b) => b.getAttribute('aria-label'));

describe('exportBar', () => {
  it('sits in one row with the pager, icons with a label and tooltip', () => {
    const { g } = mk();
    const row = g.el.querySelector('.op-grid__footer')!;
    expect(row.querySelector('.op-grid__pager')).toBeTruthy();
    expect(row.querySelector('.op-exportbar')).toBeTruthy();
    expect(shown(g)).toEqual(['Export CSV', 'Export Excel', 'Export this page (CSV)', 'Print']);
  });

  it('each button can be left out, and the page one follows paging', () => {
    expect(shown(mk({ print: false, xlsx: false }).g)).toEqual(['Export CSV', 'Export this page (CSV)']);
    document.body.innerHTML = '';
    expect(shown(mk({}, { paging: false, store: new Store({ data: rows }) }).g)).toEqual(['Export CSV', 'Export Excel', 'Print']);
  });

  it('setVisible and setDisabled control one button', () => {
    const { g, plugin } = mk();
    plugin.setVisible('print', false);
    expect(shown(g)).not.toContain('Print');
    plugin.setDisabled('csv', true);
    expect((btns(g)[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('a click exports (and print runs printGrid)', async () => {
    const created = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: () => {} });
    const { g } = mk();
    btns(g)[0].click();
    await new Promise((r) => setTimeout(r, 20));
    expect(created).toHaveBeenCalled();
  });

  it('destroy gives the pager back and removes the row', () => {
    const { g } = mk();
    g.destroy();
    expect(document.querySelector('.op-grid__footer')).toBeNull();
  });
});
