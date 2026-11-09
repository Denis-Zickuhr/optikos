// Reads the project's docs once and exposes them as data. Used by the docs site (as .dev/site.json) and by the MCP server.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { root, componentEntries } from './lib.mjs';

const p = (...a) => join(root, ...a);
const read = (f) => readFileSync(p(f), 'utf8');
const KEYS = ['Propósito', 'Anatomia', 'Config', 'API', 'Eventos', 'Estados', 'Teclado/ARIA', 'Tokens', 'Casos sandbox', 'Fora do escopo'];

/** Splits a spec sheet ("Key:   text" with indented continuation lines) into { key: text }. */
export function parseFicha(md) {
  const fields = {};
  let key = null;
  for (const line of md.split('\n').slice(1)) {
    const m = /^([^\s:`][^:`]{1,28}):\s+(.*)$/.exec(line);
    if (m && (KEYS.includes(m[1]) || !line.startsWith(' '))) {
      key = m[1];
      fields[key] = m[2];
    } else if (key && line.trim()) fields[key] += '\n' + line.trim();
  }
  return fields;
}

const GUIDES = { ui: 'Escrita enxuta (ui e enums)', architecture: 'Decisões de arquitetura', theming: 'Tematização', motion: 'Motion', catalog: 'Catálogo' };

export function examples() {
  return existsSync(p('site/examples.json')) ? JSON.parse(read('site/examples.json')) : {};
}

/** Every spec sheet with its category (from src/components/<category>/<name>) and its live examples. */
export function components() {
  const cats = Object.fromEntries(Object.entries(componentEntries()).map(([n, f]) => [n, f.split('/').slice(-3)[0]]));
  const ex = examples();
  return readdirSync(p('docs/components'))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((f) => {
      const name = basename(f, '.md');
      const md = read(`docs/components/${f}`);
      const head = /^#\s+(.+?)\s+\(type:\s*'([\w]+)'\)/.exec(md);
      const fields = parseFicha(md);
      return { name, title: head?.[1] ?? name, type: head?.[2] ?? null, category: cats[name] ?? 'core', summary: fields['Propósito'] ?? '', fields, examples: ex[name] ?? [] };
    });
}

export function guides() {
  return Object.entries(GUIDES).map(([name, title]) => ({ name, title, markdown: read(`docs/${name}.md`) }));
}

/** Design tokens: every `--op-*` declared in the base theme with its default value, plus the shipped theme names. */
export function tokens() {
  const css = read('src/themes/base.css');
  const out = {};
  for (const m of css.matchAll(/(--op-[\w-]+):\s*([^;]+);/g)) out[m[1]] ??= m[2].trim();
  return out;
}

export function themes() {
  return ['light', ...readdirSync(p('src/themes')).filter((f) => f.endsWith('.css') && f !== 'base.css').map((f) => basename(f, '.css'))];
}

/** The GitHub URL from package.json `repository` (the static docs site links sandboxes and demos there). */
export function repo() {
  return JSON.parse(read('package.json')).repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
}

export function siteData() {
  return { components: components(), guides: guides(), tokens: tokens(), themes: themes(), repo: repo() };
}
