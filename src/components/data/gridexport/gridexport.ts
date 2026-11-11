// Grid export as CSV or Excel (.xlsx), without a library: the columns the user sees, in their order, as shown (formats applied).
import { cellContent } from '../../../data/column';
import type { Model } from '../../../data/model';
import type { Grid } from '../grid/grid';

export interface ExportOptions {
  format?: 'csv' | 'xlsx';
  /** File name without extension. Default `export`. */
  filename?: string;
  /** `all` (default): every record that matches the sort and filters, across pages (a remote store is read through its proxy). `page`: what the grid shows now. */
  scope?: 'all' | 'page';
  /** Page size for reading a remote store. Default 500. */
  pageSize?: number;
  /** `false` only builds the file and returns it. Default true: the browser downloads it. */
  download?: boolean;
}

const MIME = { csv: 'text/csv;charset=utf-8', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
const enc = new TextEncoder();

const textOf = (v: string | Node) => (typeof v === 'string' ? v : (v.textContent ?? ''));
const csvCell = (s: string) => (/[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
// a cell starting with = + - @ would run as a formula in a spreadsheet
const safe = (s: string) => (/^[=+@]/.test(s) || /^-[^\d.,]/.test(s) ? `'${s}` : s);

function table(grid: Grid, recs: Model[]): { head: string[]; rows: Array<Array<string | number>> } {
  const cols = grid.getColumns();
  return {
    head: cols.map((c) => c.header ?? c.field),
    rows: recs.map((r) =>
      cols.map((c) => {
        const raw = r.data[c.field];
        // a number nobody formatted stays a number in Excel
        return typeof raw === 'number' && !c.format && !c.renderer ? raw : safe(textOf(cellContent(c, r)));
      }),
    ),
  };
}

const crc = (() => {
  const t = Array.from({ length: 256 }, (_, n) => {
    for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
    return n >>> 0;
  });
  return (b: Uint8Array) => {
    let c = ~0;
    for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8);
    return ~c >>> 0;
  };
})();

/** A zip with the files stored uncompressed: all an .xlsx needs. */
function zip(files: Record<string, string>): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u32 = (v: DataView, o: number, n: number) => v.setUint32(o, n, true);
  for (const [name, text] of Object.entries(files)) {
    const nameB = enc.encode(name);
    const data = enc.encode(text);
    const head = new Uint8Array(30 + nameB.length);
    const v = new DataView(head.buffer);
    u32(v, 0, 0x04034b50);
    v.setUint16(4, 20, true);
    v.setUint16(6, 0x800, true); // UTF-8 names
    u32(v, 14, crc(data));
    u32(v, 18, data.length);
    u32(v, 22, data.length);
    v.setUint16(26, nameB.length, true);
    head.set(nameB, 30);
    const entry = new Uint8Array(46 + nameB.length);
    const e = new DataView(entry.buffer);
    u32(e, 0, 0x02014b50);
    e.setUint16(4, 20, true);
    e.setUint16(6, 20, true);
    e.setUint16(8, 0x800, true);
    u32(e, 16, crc(data));
    u32(e, 20, data.length);
    u32(e, 24, data.length);
    e.setUint16(28, nameB.length, true);
    u32(e, 42, offset);
    entry.set(nameB, 46);
    central.push(entry);
    parts.push(head, data);
    offset += head.length + data.length;
  }
  const size = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const v = new DataView(end.buffer);
  u32(v, 0, 0x06054b50);
  v.setUint16(8, central.length, true);
  v.setUint16(10, central.length, true);
  u32(v, 12, size);
  u32(v, 16, offset);
  const all = new Uint8Array(offset + size + 22);
  let at = 0;
  for (const p of [...parts, ...central, end]) (all.set(p, at), (at += p.length));
  return all;
}

const xml = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const ref = (col: number, row: number) => {
  let s = '';
  for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s + (row + 1);
};

function xlsx(head: string[], rows: Array<Array<string | number>>): Blob {
  const cell = (v: string | number, c: number, r: number, bold = false) =>
    typeof v === 'number' ? `<c r="${ref(c, r)}"><v>${v}</v></c>` : `<c r="${ref(c, r)}" t="inlineStr"${bold ? ' s="1"' : ''}><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  const lines = [head, ...rows].map((row, r) => `<row r="${r + 1}">${row.map((v, c) => cell(v, c, r, r === 0)).join('')}</row>`);
  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml': '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>',
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${lines.join('')}</sheetData></worksheet>`,
  };
  return new Blob([zip(files) as BlobPart], { type: MIME.xlsx });
}

/**
 * Exports a grid: the visible columns in their current order, values as shown (money, dates...), the current sort and filters.
 * Resolves with the file; downloads it unless `download: false`.
 */
export async function exportGrid(grid: Grid, o: ExportOptions = {}): Promise<Blob> {
  const { format = 'csv', filename = 'export', scope = 'all', download = true } = o;
  const store = grid.getStore();
  const recs = scope === 'page' ? store.getRange() : await store.fetchAll(o.pageSize);
  const { head, rows } = table(grid, recs);
  const blob =
    format === 'xlsx'
      ? xlsx(head, rows)
      : // the BOM makes Excel read UTF-8
        new Blob(['﻿' + [head, ...rows].map((r) => r.map((v) => csvCell(String(v))).join(',')).join('\r\n')], { type: MIME.csv });
  if (download) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.${format}`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return blob;
}

export interface PrintOptions {
  /** A heading above the table. */
  title?: string;
  /** `all` (default) prints every record that matches the filters, which the virtual list on screen does not render. */
  scope?: 'all' | 'page';
  pageSize?: number;
}

/**
 * Prints a grid as a plain table: every row, the visible columns, the header repeated on each page, and none of the
 * application around it. Resolves after the print dialog closed.
 */
export async function printGrid(grid: Grid, o: PrintOptions = {}): Promise<void> {
  const store = grid.getStore();
  const recs = o.scope === 'page' ? store.getRange() : await store.fetchAll(o.pageSize);
  const { head, rows } = table(grid, recs);
  const sheet = document.createElement('div');
  sheet.className = 'op-print-sheet';
  const cell = (tag: 'th' | 'td', v: string | number) => Object.assign(document.createElement(tag), { textContent: String(v) });
  const tr = (tag: 'th' | 'td', cells: Array<string | number>) => {
    const row = document.createElement('tr');
    row.append(...cells.map((v) => cell(tag, v)));
    return row;
  };
  const el = document.createElement('table');
  const thead = document.createElement('thead');
  thead.append(tr('th', head));
  const tbody = document.createElement('tbody');
  tbody.append(...rows.map((r) => tr('td', r)));
  el.append(thead, tbody);
  if (o.title) sheet.append(Object.assign(document.createElement('h1'), { textContent: o.title }));
  sheet.append(el);
  document.body.append(sheet);
  document.documentElement.classList.add('op-printing');
  await new Promise<void>((done) => {
    const finish = () => {
      window.removeEventListener('afterprint', finish);
      sheet.remove();
      document.documentElement.classList.remove('op-printing');
      done();
    };
    window.addEventListener('afterprint', finish);
    window.print();
    // some browsers return from print() without the event
    if (typeof matchMedia !== 'function') setTimeout(finish, 0);
  });
}
