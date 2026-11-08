import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { listPages } from './lib.mjs';

const root = process.cwd();
const dirs = (d) => readdirSync(join(root, d), { withFileTypes: true }).filter((e) => e.isDirectory() && existsSync(join(root, d, e.name, 'main.ts'))).map((e) => e.name);

describe('dev pages list (feeds the index and the navigation frame)', () => {
  const pages = listPages();

  it('contains every sandbox and demo folder, with working hrefs', () => {
    expect(pages.filter((p) => p.kind === 'sandbox').map((p) => p.name).sort()).toEqual(dirs('sandbox').sort());
    expect(pages.filter((p) => p.kind === 'demo').map((p) => p.name).sort()).toEqual(dirs('demos').sort());
    for (const p of pages) {
      expect(p.href).toBe(`/${p.kind === 'sandbox' ? 'sandbox' : 'demos'}/${p.name}/`);
      expect(existsSync(join(root, p.href, 'index.html')), p.href).toBe(true);
    }
  });

  it('lists sandboxes in catalog order and extracts section titles and demo descriptions', () => {
    const names = pages.filter((p) => p.kind === 'sandbox').map((p) => p.name);
    expect(names.indexOf('base')).toBeLessThan(names.indexOf('fields'));
    expect(names.indexOf('fields')).toBeLessThan(names.indexOf('dates'));
    expect(pages.find((p) => p.name === 'base').sections).toContain('Label');
    expect(pages.find((p) => p.name === 'navigation').sections).toContain('Breadcrumb');
    expect(pages.find((p) => p.kind === 'demo' && p.name === 'crm').description).toMatch(/CRM demo/);
  });

  it('demos import only the public API (and their own local files)', async () => {
    const { readFileSync, readdirSync } = await import('node:fs');
    for (const d of dirs('demos')) {
      for (const f of readdirSync(join(root, 'demos', d)).filter((n) => n.endsWith('.ts'))) {
        const src = readFileSync(join(root, 'demos', d, f), 'utf8');
        for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) expect(m[1] === 'optikos' || /^\.\/[\w-]+$/.test(m[1]), `${d}/${f} imports ${m[1]}`).toBe(true);
      }
    }
  });
});
