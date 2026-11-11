// Reads the project's docs once and exposes them as data. Used by the docs site (as .dev/site.json) and by the MCP server.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { root, componentEntries } from './lib.mjs';

const p = (...a) => join(root, ...a);
const read = (f) => readFileSync(p(f), 'utf8');
// Docs are in English (docs/...) with a Portuguese translation (docs/pt-BR/...). The sheet keys differ per language;
// CANON maps the Portuguese standard keys to the English ones so both can be compared.
export const LANGS = ['en', 'pt-BR'];
const CANON = { 'Propósito': 'Purpose', Anatomia: 'Anatomy', Config: 'Config', API: 'API', Eventos: 'Events', Estados: 'States', 'Teclado/ARIA': 'Keyboard/ARIA', Tokens: 'Tokens', 'Casos sandbox': 'Sandbox cases', 'Fora do escopo': 'Out of scope' };
const KEYS = [...Object.keys(CANON), ...Object.values(CANON)];
export const canonKey = (k) => CANON[k] ?? k;
const sheetPath = (lang, name) => (lang === 'en' ? `docs/components/${name}.md` : `docs/${lang}/components/${name}.md`);

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

// Guides with their file per language. The architecture log is a contributor document, kept in Portuguese only.
const GUIDES = [
  { name: 'getting-started', title: { en: 'Getting started', 'pt-BR': 'Começar' } },
  { name: 'theming', title: { en: 'Theming', 'pt-BR': 'Tematização' } },
  { name: 'ui', title: { en: 'Short writing (ui and enums)', 'pt-BR': 'Escrita enxuta (ui e enums)' } },
  { name: 'build', title: { en: 'Building from a field list', 'pt-BR': 'Construir a partir de campos' } },
  { name: 'erp', title: { en: 'Back-office recipes', 'pt-BR': 'Receitas para back-office' } },
  { name: 'bind', title: { en: 'Binding and the view model', 'pt-BR': 'Binding e view model' } },
  { name: 'motion', title: { en: 'Motion', 'pt-BR': 'Motion' } },
  { name: 'catalog', title: { en: 'Catalog', 'pt-BR': 'Catálogo' } },
  { name: 'performance', title: { en: 'Performance' }, files: { en: 'docs/performance.md' } },
  { name: 'architecture', title: { 'pt-BR': 'Decisões de arquitetura' }, files: { 'pt-BR': 'docs/architecture.md' } },
];

export function examples() {
  return existsSync(p('site/examples.json')) ? JSON.parse(read('site/examples.json')) : {};
}

/** Every spec sheet with its category (from src/components/<category>/<name>), its text per language and its live examples.
 *  `title`, `summary` and `fields` are the English ones; `docs[lang]` holds each language. */
export function components() {
  const cats = Object.fromEntries(Object.entries(componentEntries()).map(([n, f]) => [n, f.split('/').slice(-3)[0]]));
  const ex = examples();
  return readdirSync(p('docs/components'))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((f) => {
      const name = basename(f, '.md');
      const docs = {};
      let type = null;
      for (const lang of LANGS) {
        if (!existsSync(p(sheetPath(lang, name)))) continue;
        const md = read(sheetPath(lang, name));
        const head = /^#\s+(.+?)\s+\(type:\s*'([\w]+)'\)/.exec(md) ?? /^#\s+(.+?)\s+\(/.exec(md);
        type ??= head?.[2] ?? null;
        const fields = parseFicha(md);
        docs[lang] = { title: head?.[1] ?? name, summary: fields.Purpose ?? fields['Propósito'] ?? '', fields };
      }
      return { name, title: docs.en.title, type, category: cats[name] ?? 'core', summary: docs.en.summary, fields: docs.en.fields, docs, examples: ex[name] ?? [] };
    });
}

/** Every guide: `title`/`markdown` in English when it exists (else the only language), and `i18n[lang]` for each one. */
export function guides() {
  return GUIDES.map((g) => {
    const i18n = {};
    for (const lang of LANGS) {
      const file = g.files ? g.files[lang] : lang === 'en' ? `docs/${g.name}.md` : `docs/${lang}/${g.name}.md`;
      if (file && g.title[lang] && existsSync(p(file))) i18n[lang] = { title: g.title[lang], markdown: read(file) };
    }
    const main = i18n.en ?? Object.values(i18n)[0];
    return { name: g.name, title: main.title, markdown: main.markdown, i18n };
  });
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
