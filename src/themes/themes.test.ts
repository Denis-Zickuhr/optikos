import { describe, it, expect, afterEach } from 'vitest';
import { defineTheme, setTheme } from 'optikos';
import { parse, contrast } from './color';
import { checkContrast } from './contrast';

afterEach(() => {
  document.head.innerHTML = '';
  document.documentElement.removeAttribute('data-op-theme');
});

describe('defineTheme', () => {
  it('emits scoped custom properties inside @layer optikos, kebab-casing keys', () => {
    const t = defineTheme({ color: { primary: '#06f', primarySoft: '#eef' }, button: { radius: 0, fontWeight: 700 } }, 'brand');
    expect(t.css).toContain("@layer optikos");
    expect(t.css).toContain("[data-op-theme~='brand']");
    expect(t.css).toContain('--op-color-primary: #06f;');
    expect(t.css).toContain('--op-color-primary-soft: #eef;');
    expect(t.css).toContain('--op-button-radius: 0;');
    expect(t.css).toContain('--op-button-font-weight: 700;');
  });

  it('a plain value sets the group token itself (radius → --op-radius)', () => {
    const th = defineTheme({ radius: '0.75rem', space: { 3: '1rem' } }, 'plain-group');
    expect(th.css).toContain('--op-radius: 0.75rem;');
    expect(th.css).toContain('--op-space-3: 1rem;');
  });

  it('the key base sits beside variants in the same group', () => {
    const th = defineTheme({ radius: { base: '8px', sm: '4px' } }, 'both');
    expect(th.css).toContain('--op-radius: 8px;');
    expect(th.css).toContain('--op-radius-sm: 4px;');
  });

  it('inject adds one style tag (idempotent) without activating; apply activates and keeps other themes', () => {
    const t = defineTheme({ color: { primary: 'red' } }, 'x');
    t.inject();
    t.inject();
    expect(document.querySelectorAll('#op-theme-x')).toHaveLength(1);
    expect(document.documentElement.hasAttribute('data-op-theme')).toBe(false);
    setTheme('dark');
    t.apply();
    expect(document.documentElement.getAttribute('data-op-theme')).toBe('dark x');
    t.apply();
    expect(document.documentElement.getAttribute('data-op-theme')).toBe('dark x');
  });

  it('setTheme sets any element and accepts arrays', () => {
    const el = document.createElement('div');
    setTheme(['dark', 'compact'], el);
    expect(el.getAttribute('data-op-theme')).toBe('dark compact');
  });
});

describe('theme stylesheets', () => {
  const { readFileSync, readdirSync } = require('node:fs') as typeof import('node:fs');
  it('the package ships only light (base), dark and compact', () => {
    expect(readdirSync('src/themes').filter((f) => f.endsWith('.css')).sort()).toEqual(['base.css', 'compact.css', 'dark.css']);
  });
  it('dark.css repaints every semantic color of the base', () => {
    const names = (css: string) => [...css.matchAll(/(--op-color-[\w-]+):/g)].map((m) => m[1]);
    const dark = new Set(names(readFileSync('src/themes/dark.css', 'utf8')));
    for (const token of names(readFileSync('src/themes/base.css', 'utf8'))) expect(dark.has(token), token).toBe(true);
  });
  // dev-only looks (dev/themes): full themes that change color AND shape/density/typography, not just the palette
  const must = ['--op-color-bg', '--op-color-surface', '--op-color-fg', '--op-color-border', '--op-color-primary', '--op-color-primary-fg', '--op-radius', '--op-border-width', '--op-space-3', '--op-control-height', '--op-font-family'];
  for (const file of readdirSync('dev/themes').filter((f) => f.endsWith('.css'))) {
    const name = file.slice(0, -4);
    it(`dev theme ${name}.css is layered, scoped by data-op-theme and sets the shape tokens`, () => {
      const css = readFileSync(`dev/themes/${file}`, 'utf8');
      expect(css).toMatch(/@layer optikos\s*\{/);
      expect(css).toContain(`[data-op-theme~='${name}']`);
      for (const token of must) expect(css, token).toContain(`${token}:`);
    });
  }
});

describe('scrollbars', () => {
  it('are themed through tokens that every theme inherits', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs');
    const base = readFileSync('src/themes/base.css', 'utf8');
    for (const t of ['--op-scrollbar-thumb:', '--op-scrollbar-track:', '--op-scrollbar-width:', 'scrollbar-color:']) expect(base).toContain(t);
    expect(readFileSync('src/themes/dark.css', 'utf8')).toContain('color-scheme: dark');
  });
});

describe('seeds, fonts and the contrast checker', () => {
  const tokens = (css: string, scope: string) => {
    const block = css.split('\n  }\n').find((b) => b.includes(scope))!;
    return Object.fromEntries([...block.matchAll(/(--[\w-]+): ([^;]+);/g)].map((m) => [m[1], m[2]]));
  };
  const ratio = (t: Record<string, string>, fg: string, bg: string) => contrast(parse(t[fg])!, parse(t[bg])!);

  it('a gold and a brown seed make light and dark themes whose text pairs keep 4.5:1', () => {
    const css = defineTheme({ seeds: { primary: '#D9A441', neutral: '#2A1C12' } }, 'beleza').css;
    const light = tokens(css, "[data-op-theme~='beleza'] {");
    const dark = tokens(css, "[data-op-theme~='beleza'][data-op-theme~='dark'] {");
    for (const t of [light, dark]) {
      expect(ratio(t, '--op-color-fg', '--op-color-surface')).toBeGreaterThanOrEqual(7);
      expect(ratio(t, '--op-color-fg-muted', '--op-color-bg')).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t, '--op-color-primary-fg', '--op-color-primary')).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t, '--op-navmenu-fg', '--op-navmenu-bg')).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t, '--op-navmenu-active-fg', '--op-navmenu-active-bg')).toBeGreaterThanOrEqual(4.5);
      expect(ratio(t, '--op-grid-header-fg', '--op-grid-header-bg')).toBeGreaterThanOrEqual(4.5);
    }
    // gold fails as text on white: a separate text token carries the brand
    expect(ratio(light, '--op-color-primary-text', '--op-color-surface-2')).toBeGreaterThanOrEqual(4.5);
    expect(light['--op-color-primary']).toBe('#d9a441');
    expect(dark['--op-color-bg']).not.toBe(light['--op-color-bg']);
  });

  it('tokens given next to seeds win in the light set; a bad seed says so', () => {
    expect(defineTheme({ seeds: { primary: '#06f' }, radius: { base: '2px' } }, 'x').css).toContain('--op-radius: 2px;');
    expect(() => defineTheme({ seeds: { primary: 'blue' } })).toThrow(/hex color/);
  });

  it('fonts become @font-face rules outside the layer', () => {
    const css = defineTheme({ fonts: [{ family: 'Brand', url: '/f/brand.woff2', weight: '400 700' }], font: { family: "'Brand', sans-serif" } }, 'f').css;
    expect(css.startsWith('@font-face {')).toBe(true);
    expect(css).toContain("url('/f/brand.woff2')");
    expect(css).toContain('font-weight: 400 700;');
    expect(css).toContain("--op-font-family: 'Brand', sans-serif;");
  });

  it('checkContrast reports the pairs under 4.5:1 and skips unset tokens', () => {
    const colors: Record<string, string> = { '--op-color-fg': '#777777', '--op-color-surface': '#ffffff', '--op-color-primary-fg': '#ffffff', '--op-color-primary': '#0b3d91' };
    const issues = checkContrast(document.documentElement, { warn: false, resolve: (t) => (colors[t] ? parse(colors[t]) : undefined) });
    expect(issues).toHaveLength(1);
    expect(issues[0].pair).toBe('--op-color-fg on --op-color-surface');
    expect(issues[0].ratio).toBeLessThan(4.5);
  });
});
