import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = join(process.cwd(), 'src');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.css') ? [p] : [];
  });

// Visual values may only come from tokens. Structural zeros, percentages and keywords are fine.
describe('component CSS uses only tokens', () => {
  const css = [...files(join(root, 'components')), ...files(join(root, 'layout')), join(root, 'core/field.css'), join(root, 'core/core.css')];
  for (const f of css) {
    it(f.replace(root, 'src/'), () => {
      const text = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      // literal defaults are declared once, in `:root { --op-x: value }` blocks at the top of the file
      const body = text.replace(/:root\s*\{[^}]*\}/g, '').replace(/@(?:media|container)[^{]+\{/g, '{') // breakpoints are not visual values;
      expect(body, 'hex color').not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(body, 'color function').not.toMatch(/\b(?:rgb|rgba|hsl|hsla)\(/);
      const literals = [...body.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw)\b/g)].filter((m) => !/^100v[hw]$/.test(m[0]));
      expect(literals.map((m) => m[0])).toEqual([]);
    });
  }
  it('every component stylesheet is inside @layer optikos', () => {
    for (const f of css) expect(readFileSync(f, 'utf8'), f).toMatch(/@layer optikos\s*\{/);
  });
});
