import { describe, it, expect, afterEach } from 'vitest';
import { defineTheme, setTheme } from 'optikos';

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

describe('shipped theme stylesheets', () => {
  const { readFileSync } = require('node:fs') as typeof import('node:fs');
  const must = ['--op-color-bg', '--op-color-surface', '--op-color-fg', '--op-color-border', '--op-color-primary', '--op-color-primary-fg', '--op-radius', '--op-border-width', '--op-space-3', '--op-control-height', '--op-font-family'];
  for (const name of ['brutal', 'soft', 'terminal', 'editorial', 'brand', 'corporate']) {
    it(`${name}.css is layered, scoped by data-op-theme and sets the shape tokens`, () => {
      const css = readFileSync(`src/themes/${name}.css`, 'utf8');
      expect(css).toMatch(/@layer optikos\s*\{/);
      expect(css).toContain(`[data-op-theme~='${name}']`);
      // a full theme changes color AND shape/density/typography, not just the palette
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
