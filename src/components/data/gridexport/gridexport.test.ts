import { describe, it, expect, afterEach } from 'vitest';
import { create, Grid, Store, exportGrid, printGrid, setLocale } from 'optikos';

afterEach(() => {
  document.body.innerHTML = '';
  setLocale('en');
});
const text = (b: Blob) => new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsText(b); });
const bytes = (b: Blob) => new Promise<Uint8Array>((ok) => { const r = new FileReader(); r.onload = () => ok(new Uint8Array(r.result as ArrayBuffer)); r.readAsArrayBuffer(b); });

const grid = () => {
  const g = create<Grid>({
    type: 'grid',
    store: new Store({ data: [{ id: 1, name: 'Ana, "A"', price: 1234.5, at: '2026-11-10' }, { id: 2, name: '=SUM(A1)', price: 2, at: '2026-11-11' }], pageSize: 1 }),
    columns: [{ field: 'name', header: 'Name' }, { field: 'price', header: 'Price' }, { field: 'at', header: 'Day', format: 'date' }, { field: 'id', hidden: true }],
  } as any);
  document.body.append(g.el);
  return g;
};

describe('exportGrid', () => {
  it('writes CSV with the visible columns, escaped, formula-safe and every page by default', async () => {
    const csv = await text(await exportGrid(grid(), { download: false }));
    const lines = csv.replace('﻿', '').split('\r\n');
    expect(lines[0]).toBe('Name,Price,Day');
    expect(lines[1]).toBe('"Ana, ""A""",1234.5,"Nov 10, 2026"');
    expect(lines[2]).toBe("'=SUM(A1),2,\"Nov 11, 2026\"");
  });

  it('scope page exports only what the grid shows', async () => {
    const csv = await text(await exportGrid(grid(), { scope: 'page', download: false }));
    expect(csv.trim().split('\r\n')).toHaveLength(2);
  });

  it('writes a valid xlsx: a zip with the sheet, numbers as numbers', async () => {
    const blob = await exportGrid(grid(), { format: 'xlsx', download: false });
    const b = await bytes(blob);
    expect(String.fromCharCode(b[0], b[1])).toBe('PK');
    const raw = new TextDecoder().decode(b);
    expect(raw).toContain('xl/worksheets/sheet1.xml');
    expect(raw).toContain('<v>1234.5</v>');
    expect(raw).toContain('Ana, &#34;A&#34;');
    expect(blob.type).toContain('spreadsheetml');
  });
});

describe('printGrid', () => {
  it('puts every row in a plain table (header once, in thead) while printing, then cleans up', async () => {
    let seen = '';
    window.print = () => {
      seen = document.querySelector('.op-print-sheet')!.innerHTML;
      expect(document.documentElement.classList.contains('op-printing')).toBe(true);
      window.dispatchEvent(new Event('afterprint'));
    };
    await printGrid(grid(), { title: 'Report' });
    expect(seen).toContain('<h1>Report</h1>');
    expect(seen).toContain('<thead><tr><th>Name</th>');
    expect(seen.match(/<tr>/g)).toHaveLength(3);
    expect(document.querySelector('.op-print-sheet')).toBeNull();
    expect(document.documentElement.classList.contains('op-printing')).toBe(false);
  });
});
