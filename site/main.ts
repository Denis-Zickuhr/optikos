// Optikos living docs: every component with its spec sheet and live, editable examples, plus guides, tokens and the MCP server.
// Built with Optikos itself. Data comes from site.json next to optikos.css (scripts/docs-data.mjs), the same source the MCP server reads.
// `npm run site` serves it from the repo; `npm run site:build` writes the static copy published on GitHub Pages.
import { create, NavMenu, CommandPalette, type NavItem } from 'optikos';
import { THEMES, initialState, applyThemeState, assetBase, type DevTheme } from '../dev/themes';
import { run, snippet, type Example } from './render';
import { lang, LANGS, setLang, t, tx, type Lang, type Key } from './i18n';
import { markdown, inline } from './markdown';

interface Sheet { title: string; summary: string; fields: Record<string, string> }
interface Comp { name: string; type: string | null; category: string; docs: Partial<Record<Lang, Sheet>>; examples: Example[] }
interface Guide { name: string; i18n: Partial<Record<Lang, { title: string; markdown: string }>> }
interface Data { components: Comp[]; guides: Guide[]; tokens: Record<string, string>; themes: string[]; repo: string; static?: boolean }

const css = `
body{margin:0;background:var(--op-color-bg);color:var(--op-color-fg);font:var(--op-font-size)/var(--op-line-height) var(--op-font-family)}
.site{display:grid;grid-template-columns:17rem minmax(0,1fr);grid-template-rows:auto 1fr;min-block-size:100vh}
.site__top{grid-column:1/-1;position:sticky;inset-block-start:0;z-index:5;display:flex;align-items:center;gap:.75rem;padding:.5rem 1rem;background:var(--op-color-surface);border-block-end:1px solid var(--op-color-border)}
.site__brand{font-weight:700;font-size:1.1rem;margin-inline-end:auto}
.site__theme{inline-size:9rem}.site__lang{inline-size:8.5rem}.site__menu{display:none}
.site__nav{min-block-size:calc(100vh - 3.25rem);box-sizing:border-box;position:sticky;inset-block-start:3.25rem;align-self:start;max-block-size:calc(100vh - 3.25rem);overflow:auto;padding:.5rem;border-inline-end:1px solid var(--op-color-border);background:var(--op-color-surface)}
.site__nav .op-textfield{margin-block-end:.5rem}
.site__main{padding:1.5rem;max-inline-size:62rem;inline-size:100%;box-sizing:border-box;min-inline-size:0}
.site__main h1{margin:0 0 .25rem}.site__main h2{margin:1.5rem 0 .5rem}.site__lead{color:var(--op-color-fg-muted);margin:0 0 1rem}
.site__chips{display:flex;gap:.5rem;flex-wrap:wrap;margin-block-end:1rem}
.site__chip{padding:.1rem .6rem;border-radius:var(--op-radius-pill);background:var(--op-color-surface-2);border:1px solid var(--op-color-border);font-size:var(--op-font-size-sm)}
.site__ex{border:1px solid var(--op-color-border);border-radius:var(--op-radius);background:var(--op-color-surface);margin-block-end:1rem;overflow:hidden}
.site__ex>header{padding:.6rem 1rem;border-block-end:1px solid var(--op-color-border)}.site__ex h3{margin:0;font-size:1rem}.site__ex p{margin:.15rem 0 0;color:var(--op-color-fg-muted)}
.site__stage{padding:1rem;display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-start;min-block-size:4rem;overflow:auto}
.site__code{display:grid;gap:.5rem;padding:.75rem 1rem;border-block-start:1px solid var(--op-color-border);background:var(--op-color-surface-2)}
.site__code textarea,.site__code pre{margin:0;box-sizing:border-box;inline-size:100%;min-block-size:7rem;max-block-size:20rem;overflow:auto;padding:.5rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius-sm);background:var(--op-color-bg);color:var(--op-color-fg);font:.8rem/1.45 var(--op-font-mono);resize:vertical}
.site__bar{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}.site__err{color:var(--op-color-danger);font-size:var(--op-font-size-sm)}
.site__fields{display:grid;grid-template-columns:9rem minmax(0,1fr);gap:.4rem 1rem}.site__fields dt{font-weight:600;color:var(--op-color-fg-muted)}.site__fields dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.site code:not([class]){font-family:var(--op-font-mono);font-size:.88em;background:var(--op-color-surface-2);padding:.05em .3em;border-radius:var(--op-radius-sm)}
.site pre code{background:none;padding:0}
.site__main table{border-collapse:collapse;inline-size:100%;margin-block:.5rem}.site__main th,.site__main td{text-align:start;padding:.3rem .6rem;border:1px solid var(--op-color-border);vertical-align:top}
.site__tokens td:first-child{font-family:var(--op-font-mono);font-size:.85em}.site__sw{display:inline-block;inline-size:1em;block-size:1em;border-radius:3px;border:1px solid var(--op-color-border);vertical-align:-.15em;margin-inline-end:.4em}
.site__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(14rem,1fr));gap:.75rem}
.site__card{padding:.75rem;border:1px solid var(--op-color-border);border-radius:var(--op-radius);background:var(--op-color-surface);cursor:pointer;text-align:start;font:inherit;color:inherit}
.site__card:hover{border-color:var(--op-color-primary)}.site__card b{display:block}.site__card span{color:var(--op-color-fg-muted);font-size:var(--op-font-size-sm)}
@media (max-width:50rem){.site{grid-template-columns:minmax(0,1fr)}.site__menu{display:inline-flex}.site__nav{position:fixed;inset-block:3.25rem 0;inset-inline-start:0;z-index:4;inline-size:17rem;max-block-size:none;transform:translateX(-100%);transition:transform var(--op-motion-dropdown, .2s)}
.site.is-nav-open .site__nav{transform:none}.site__main{padding:1rem}.site__fields{grid-template-columns:1fr}}
`;
document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
document.title = 'Optikos docs';

// the reader's language, or the other one when a page only exists there
const sheet = (c: Comp): Sheet => (c.docs[lang] ?? c.docs.en ?? Object.values(c.docs)[0])!;
const guideText = (g: Guide) => g.i18n[lang] ?? g.i18n.en ?? Object.values(g.i18n)[0]!;
const langName = (l: string) => LANGS.find((x) => x.value === l)?.label ?? l;

const data: Data = await (await fetch(`${assetBase()}site.json`)).json();
// Sandboxes and demos only exist on the dev server; the static site points to their source instead.
const devLink = (path: string) => (data.static ? `${data.repo}/tree/main${path.replace(/\/$/, '')}` : path);
const comps = new Map(data.components.map((c) => [c.name, c]));
const root = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'site' }));
const top = root.appendChild(Object.assign(document.createElement('header'), { className: 'site__top' }));
const nav = root.appendChild(Object.assign(document.createElement('aside'), { className: 'site__nav' }));
const main = root.appendChild(Object.assign(document.createElement('main'), { className: 'site__main' }));

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '', parent?: HTMLElement) => {
  const e = Object.assign(document.createElement(tag), { className: cls });
  if (text) e.textContent = text;
  parent?.append(e);
  return e;
};

// ---- chrome -------------------------------------------------------------------------------------
create({ type: 'button', icon: 'menu', variant: 'ghost', ariaLabel: t('navigation'), cls: 'site__menu', renderTo: top, handler: () => root.classList.toggle('is-nav-open') } as never);
h('div', 'site__brand', 'Optikos', top);
create({ type: 'button', icon: 'search', text: `${t('search')}  Ctrl K`, variant: 'ghost', renderTo: top, handler: () => palette.open() } as never);
const state = initialState();
create({ type: 'select', cls: 'site__lang', ariaLabel: t('language'), options: LANGS, value: lang, stableSize: false, renderTo: top, listeners: { change: (v: Lang) => v && v !== lang && setLang(v) } } as never);
create({ type: 'select', cls: 'site__theme', ariaLabel: t('theme'), options: [...THEMES], value: state.theme, stableSize: false, renderTo: top, listeners: { change: (v: string) => v && applyThemeState({ ...state, theme: v as DevTheme }) } } as never);
applyThemeState(state);

const ORDER = ['base', 'layout', 'fields', 'form', 'data', 'dates', 'overlays', 'navigation', 'feedback', 'chat'];
const byCategory = new Map<string, Comp[]>();
for (const c of data.components) if (c.examples.length) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
const sorted = [...byCategory].sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b));
const label = (s: string) => t(`cat_${s}` as Key) || s;
const items: NavItem[] = [
  { id: 'home', text: t('start'), icon: 'home' },
  { id: 'cat', text: t('components'), icon: 'menu', expanded: true, items: sorted.map(([cat, list]) => ({ id: `cat-${cat}`, text: label(cat), items: list.map((c) => ({ id: `c/${c.name}`, text: sheet(c).title })) })) },
  { id: 'gd', text: t('guides'), icon: 'edit', items: data.guides.map((g) => ({ id: `g/${g.name}`, text: guideText(g).title })) },
  { id: 'tokens', text: t('tokens'), icon: 'star' },
  { id: 'mcp', text: t('mcp'), icon: 'user' },
];
create({ type: 'textfield', placeholder: t('filterComponents'), clearable: true, ariaLabel: t('filterComponents'), renderTo: nav, listeners: { change: (v: string) => menu.filter(v) } } as never);
const menu = create<NavMenu>({ type: 'navmenu', items, ariaLabel: t('documentation'), renderTo: nav, listeners: { select: (i: NavItem) => go(i.id) } } as never);

const palette = create<CommandPalette>({
  type: 'commandpalette',
  commands: [
    { id: 'home', title: t('start'), category: t('goTo'), handler: () => go('home') },
    { id: 'tokens', title: t('tokens'), category: t('goTo'), handler: () => go('tokens') },
    { id: 'mcp', title: t('mcp'), category: t('goTo'), handler: () => go('mcp') },
    ...data.guides.map((g) => ({ id: `g/${g.name}`, title: guideText(g).title, category: t('guides'), handler: () => go(`g/${g.name}`) })),
    ...data.components.filter((c) => c.examples.length).map((c) => ({ id: `c/${c.name}`, title: sheet(c).title, category: t('components'), description: sheet(c).summary.slice(0, 80), keywords: [c.type ?? '', c.category], handler: () => go(`c/${c.name}`) })),
  ],
} as never);

// ---- routing ------------------------------------------------------------------------------------
let cleanups: (() => void)[] = [];
function go(id: string) {
  location.hash = `#/${id}`;
}
function route() {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'home';
  for (const c of cleanups.splice(0)) c();
  main.replaceChildren();
  root.classList.remove('is-nav-open');
  if (id.startsWith('c/') && comps.has(id.slice(2))) component(comps.get(id.slice(2))!);
  else if (id.startsWith('g/')) guide(id.slice(2));
  else if (id === 'tokens') tokens();
  else if (id === 'mcp') mcp();
  else home();
  menu.setActive(id);
  scrollTo(0, 0);
}
addEventListener('hashchange', route);

// ---- pages --------------------------------------------------------------------------------------
function home() {
  h('h1', '', 'Optikos', main);
  h('p', 'site__lead', t('lead'), main);
  const chips = h('div', 'site__chips', '', main);
  for (const chip of [t('nComponents', { n: data.components.filter((c) => c.examples.length).length }), t('nThemes', { n: data.themes.length }), t('nTokens', { n: Object.keys(data.tokens).length })]) h('span', 'site__chip', chip, chips);
  for (const [cat, list] of sorted) {
    h('h2', '', label(cat), main);
    const grid = h('div', 'site__grid', '', main);
    for (const c of list) {
      const card = h('button', 'site__card', '', grid);
      h('b', '', sheet(c).title, card);
      h('span', '', sheet(c).summary.slice(0, 110), card);
      card.addEventListener('click', () => go(`c/${c.name}`));
    }
  }
}

function component(c: Comp) {
  const doc = sheet(c);
  h('h1', '', doc.title, main);
  const chips = h('div', 'site__chips', '', main);
  if (c.type) h('span', 'site__chip', `type: '${c.type}'`, chips);
  h('span', 'site__chip', label(c.category), chips);
  if (!c.docs[lang]) h('p', 'site__lead', t('onlyIn', { lang: langName(Object.keys(c.docs)[0]) }), main);
  inline(doc.summary, h('p', 'site__lead', '', main));
  h('h2', '', t('examples'), main);
  c.examples.forEach((ex) => example(ex));
  h('h2', '', t('sheet'), main);
  const dl = h('dl', 'site__fields', '', main);
  for (const [k, v] of Object.entries(doc.fields)) {
    h('dt', '', k, dl);
    inline(v, h('dd', '', '', dl));
  }
  const links = h('p', '', '', main);
  inline(`${t('moreSandbox')} [sandbox/${c.category}](${devLink(`/sandbox/${c.category}/`)})`, links);
}

function example(ex: Example) {
  const box = h('section', 'site__ex', '', main);
  const head = h('header', '', '', box);
  h('h3', '', tx(ex.title), head);
  if (ex.description) h('p', '', tx(ex.description), head);
  const stage = h('div', 'site__stage', '', box);
  const code = h('div', 'site__code', '', box);
  if (!ex.config) {
    h('pre', '', ex.code ?? '', code);
    if (ex.demo) inline(`${t('runningExample')} [${ex.demo}](${devLink(ex.demo)})`, h('p', '', '', code));
    stage.remove();
    return;
  }
  const original = JSON.stringify(ex.config, null, 2);
  const area = h('textarea', '', '', code);
  area.value = original;
  area.spellcheck = false;
  area.setAttribute('aria-label', `${t('configOf')} ${tx(ex.title)}`);
  const bar = h('div', 'site__bar', '', code);
  const err = h('span', 'site__err', '', bar);
  let stop = () => {};
  const apply = () => {
    stop();
    stop = () => {};
    err.textContent = '';
    try {
      stop = run(ex, JSON.parse(area.value), stage);
    } catch (e) {
      err.textContent = String((e as Error).message);
    }
  };
  create({ type: 'button', text: t('apply'), variant: 'primary', renderTo: bar, handler: apply } as never);
  create({ type: 'button', text: t('reset'), renderTo: bar, handler: () => { area.value = original; apply(); } } as never);
  create({ type: 'button', text: t('copy'), icon: 'plus', variant: 'ghost', renderTo: bar, handler: () => void navigator.clipboard?.writeText(snippet(ex, JSON.parse(area.value))) } as never);
  area.addEventListener('keydown', (e) => e.ctrlKey && e.key === 'Enter' && apply());
  apply();
  cleanups.push(() => stop());
}

function guide(name: string) {
  const g = data.guides.find((x) => x.name === name);
  if (!g) return void h('p', '', t('guideMissing'), main);
  if (!g.i18n[lang]) h('p', 'site__lead', t('onlyIn', { lang: langName(Object.keys(g.i18n)[0]) }), main);
  main.append(markdown(guideText(g).markdown));
}

function tokens() {
  h('h1', '', t('tokens'), main);
  h('p', 'site__lead', t('tokensLead'), main);
  h('h2', '', t('themes'), main);
  inline(data.themes.map((x) => `\`${x}\``).join(' · ') + ' ' + t('themesCombine'), h('p', '', '', main));
  h('h2', '', 'Tokens', main);
  const find = create({ type: 'textfield', placeholder: t('filterTokens'), clearable: true, ariaLabel: t('filterTokens'), renderTo: main } as never);
  const table = h('table', 'site__tokens', '', main);
  const rows = Object.entries(data.tokens).map(([k, v]) => {
    const tr = h('tr', '', '', table);
    h('td', '', k, tr);
    const td = h('td', '', '', tr);
    if (/^(#|rgb|hsl|var\(--op-(color|[a-z]+-\d))/.test(v)) h('span', 'site__sw', '', td).style.background = v;
    td.append(v);
    return { tr, k };
  });
  (find as unknown as { on(e: string, fn: (v: string) => void): void }).on('change', (q) => rows.forEach(({ tr, k }) => (tr.hidden = !k.includes(q.trim()))));
}

function mcp() {
  h('h1', '', t('mcp'), main);
  h('p', 'site__lead', t('mcpLead'), main);
  h('h2', '', t('connect'), main);
  inline(t('mcpConnect'), h('p', '', '', main));
  h('pre', '', JSON.stringify({ mcpServers: { optikos: { command: 'node', args: ['scripts/mcp.mjs'], cwd: '<path to the optikos repo>' } } }, null, 2), main);
  inline(t('mcpRun'), h('p', '', '', main));
  h('h2', '', t('tools'), main);
  const table = h('table', '', '', main);
  for (const [n, d] of [
    ['list_components', 'Every component: name, type, category, purpose.'],
    ['get_component', 'The full spec sheet of one component.'],
    ['get_examples', 'Runnable example configs (the ones on this site).'],
    ['search_docs', 'Search over spec sheets and guides.'],
    ['get_guide', 'architecture, theming, motion or catalog, in full.'],
    ['get_tokens', 'Design tokens with defaults, filtered by prefix.'],
    ['list_themes', 'The shipped themes.'],
  ]) {
    const tr = h('tr', '', '', table);
    h('td', '', n, tr).style.fontFamily = 'var(--op-font-mono)';
    h('td', '', d, tr);
  }
}

route();
document.addEventListener('keydown', (e) => (e.ctrlKey || e.metaKey) && e.key === 'k' && (e.preventDefault(), void 0));
