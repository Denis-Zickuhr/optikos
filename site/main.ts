// Optikos docs site: a landing page, every component with live examples and its spec sheet, recipes, the demos,
// guides, tokens and the MCP server. Built with Optikos itself, in English and Portuguese.
// Data comes from site.json next to optikos.css (scripts/site.mjs): `npm run site` serves it, `npm run site:build` writes
// the static copy published on GitHub Pages.
import { create, ui, toast, stagger, iconEl, Container, type NavItem, type NavMenu, type CommandPalette, type Select, type Form, type Component } from 'optikos';
import { PUBLIC_THEMES, initialState, applyThemeState, assetBase, type DevTheme } from '../dev/themes';
import { run, snippet, type Example } from './render';
import { markdown, inline } from './markdown';
import { lang, LANGS, setLang, t, tx, type Lang, type Key } from './i18n';
import { css } from './style';
import { codeBlock, copy } from './code';
import { recipes, type Recipe } from './recipes/index';
import { DEMOS } from './demos';

interface Sheet { title: string; summary: string; fields: Record<string, string> }
interface Comp { name: string; type: string | null; category: string; docs: Partial<Record<Lang, Sheet>>; examples: Example[] }
interface Guide { name: string; i18n: Partial<Record<Lang, { title: string; markdown: string }>> }
interface Data {
  components: Comp[]; guides: Guide[]; tokens: Record<string, string>; themes: string[]; repo: string; version: string;
  recipes: Record<string, string>; demos: string[]; sizes: { core: number; full: number; components: Record<string, number> }; static?: boolean;
}

document.head.append(Object.assign(document.createElement('style'), { textContent: css }));
const data: Data = await (await fetch(`${assetBase()}site.json`)).json();
const comps = new Map(data.components.map((c) => [c.name, c]));
const documented = data.components.filter((c) => c.examples.length);

// the reader's language, or the other one when a page only exists there
const sheet = (c: Comp): Sheet => (c.docs[lang] ?? c.docs.en ?? Object.values(c.docs)[0])!;
const guideText = (g: Guide) => g.i18n[lang] ?? g.i18n.en ?? Object.values(g.i18n)[0]!;
const langName = (l: string) => LANGS.find((x) => x.value === l)?.label ?? l;
const label = (cat: string) => t(`cat_${cat}` as Key);
// sandboxes and demos come from the dev server; the static site has the demos built in and links sandboxes to GitHub
const sandboxLink = (cat: string) => (data.static ? `${data.repo}/tree/main/sandbox/${cat}` : `/sandbox/${cat}/`);
const demoUrl = (name: string) => (data.static ? `demos/${name}/` : `/demos/${name}/`);
const exampleLink = (path: string) => (data.static ? demoUrl(path.replace(/^\/demos\/|\/$/g, '')) : path);

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '', parent?: HTMLElement) => {
  const e = Object.assign(document.createElement(tag), { className: cls });
  if (text) e.textContent = text;
  parent?.append(e);
  return e;
};

// ---- chrome -------------------------------------------------------------------------------------
const root = document.body.appendChild(el('div', 'site'));
const top = root.appendChild(el('header', 'site__top'));
const nav = root.appendChild(el('aside', 'site__nav'));
const main = root.appendChild(el('main', 'site__main'));
main.id = 'main';

create({ type: 'button', icon: 'menu', variant: 'ghost', ariaLabel: t('navigation'), cls: 'site__menu', renderTo: top, handler: () => root.classList.toggle('is-nav-open') } as never);
const brand = el('a', 'site__brand', '', top);
brand.href = '#/';
brand.append(el('span', 'site__logo'), 'Optikos');
const links = el('nav', 'site__links', '', top);
links.setAttribute('aria-label', t('navigation'));
const LINKS: [string, Key][] = [['components', 'components'], ['recipes', 'recipes'], ['demos', 'demos'], ['g/getting-started', 'getStarted']];
for (const [id, key] of LINKS) Object.assign(el('a', '', t(key), links), { href: `#/${id}` }).dataset.route = id;
create({ type: 'button', icon: 'search', text: `${t('search')} Ctrl K`, ariaLabel: `${t('search')} Ctrl K`, cls: 'site__search', variant: 'ghost', renderTo: top, handler: () => palette.open() } as never);
create({ type: 'select', cls: 'site__lang', ariaLabel: t('language'), options: LANGS, value: lang, stableSize: false, renderTo: top, listeners: { change: (v: Lang) => v && v !== lang && setLang(v) } } as never);
const state = initialState(PUBLIC_THEMES);
const themeListeners = new Set<(theme: string) => void>();
const themeSelect = create<Select>({
  type: 'select', cls: 'site__theme', ariaLabel: t('theme'), options: [...PUBLIC_THEMES], value: state.theme, stableSize: false, renderTo: top,
  listeners: { change: (v: string) => { if (!v) return; applyThemeState({ ...state, theme: v as DevTheme }); themeListeners.forEach((fn) => fn(v)); } },
} as never);
applyThemeState(state);

const ORDER = ['base', 'layout', 'fields', 'form', 'data', 'dates', 'overlays', 'navigation', 'feedback', 'chat'];
const byCategory = new Map<string, Comp[]>();
for (const c of documented) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
const sorted = [...byCategory].sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b));

const items: NavItem[] = [
  { id: 'home', text: t('start'), icon: 'home' },
  { id: 'g/getting-started', text: t('getStarted'), icon: 'chevron-right' },
  { id: 'components', text: t('components'), icon: 'columns', expanded: true, items: sorted.map(([cat, list]) => ({ id: `cat-${cat}`, text: label(cat), items: list.map((c) => ({ id: `c/${c.name}`, text: sheet(c).title })) })) },
  { id: 'recipes', text: t('recipes'), icon: 'list', items: recipes.map((r) => ({ id: `r/${r.id}`, text: tx(r.title) })) },
  { id: 'demos', text: t('demos'), icon: 'image' },
  { id: 'gd', text: t('guides'), icon: 'edit', items: data.guides.filter((g) => g.name !== 'getting-started').map((g) => ({ id: `g/${g.name}`, text: guideText(g).title })) },
  { id: 'tokens', text: t('tokens'), icon: 'sun' },
  { id: 'mcp', text: t('mcp'), icon: 'settings' },
];
create({ type: 'textfield', placeholder: t('filterComponents'), clearable: true, ariaLabel: t('filterComponents'), renderTo: nav, listeners: { change: (v: string) => menu.filter(v) } } as never);
const menu = create<NavMenu>({ type: 'navmenu', items, ariaLabel: t('documentation'), renderTo: nav, listeners: { select: (i: NavItem) => go(i.id) } } as never);

const palette = create<CommandPalette>({
  type: 'commandpalette',
  categories: [t('goTo'), t('components'), t('recipes'), t('guides'), t('demos'), 'Tokens'],
  commands: [
    ...([['home', 'start'], ['components', 'components'], ['recipes', 'recipes'], ['demos', 'demos'], ['tokens', 'tokens'], ['mcp', 'mcp']] as [string, Key][]).map(([id, key]) => ({ id, title: t(key), category: t('goTo'), handler: () => go(id) })),
    ...documented.map((c) => ({ id: `c/${c.name}`, title: sheet(c).title, category: t('components'), description: sheet(c).summary.slice(0, 80), keywords: [c.type ?? '', c.category], handler: () => go(`c/${c.name}`) })),
    ...recipes.map((r) => ({ id: `r/${r.id}`, title: tx(r.title), category: t('recipes'), icon: r.icon, handler: () => go(`r/${r.id}`) })),
    ...data.guides.map((g) => ({ id: `g/${g.name}`, title: guideText(g).title, category: t('guides'), handler: () => go(`g/${g.name}`) })),
    ...DEMOS.map((d) => ({ id: `d/${d.name}`, title: tx(d.title), category: t('demos'), icon: d.icon, description: tx(d.text).slice(0, 80), handler: () => void open(demoUrl(d.name), '_blank') })),
    ...Object.keys(data.tokens).map((k) => ({ id: `t/${k}`, title: k, category: 'Tokens', handler: () => go(`tokens/${k}`) })),
  ],
} as never);

// ---- routing ------------------------------------------------------------------------------------
let cleanups: (() => void)[] = [];
const go = (id: string) => (location.hash = `#/${id}`);
function route() {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'home';
  for (const c of cleanups.splice(0)) c();
  main.replaceChildren();
  root.classList.remove('is-nav-open');
  root.classList.toggle('is-home', id === 'home');
  if (id.startsWith('c/') && comps.has(id.slice(2))) component(comps.get(id.slice(2))!);
  else if (id.startsWith('r/') && recipes.some((r) => r.id === id.slice(2))) recipe(recipes.find((r) => r.id === id.slice(2))!);
  else if (id.startsWith('g/')) guide(id.slice(2));
  else if (id.startsWith('tokens')) tokens(id.slice(7));
  else if (id === 'components') componentsIndex();
  else if (id === 'recipes') recipesIndex();
  else if (id === 'demos') demosPage();
  else if (id === 'mcp') mcp();
  else home();
  menu.setActive(id);
  for (const a of links.querySelectorAll('a')) a.classList.toggle('is-on', id === a.dataset.route || id.startsWith(`${a.dataset.route?.[0]}/`) && a.dataset.route !== 'g/getting-started');
  scrollTo(0, 0);
  void stagger(main.querySelectorAll('.site__card, .home__stat, .home__pillar, .demo, .example'), { max: 16 } as never);
}
addEventListener('hashchange', route);

/** A component this page created: destroyed when the route changes. */
function own<T extends Component>(c: T): T {
  cleanups.push(() => c.destroy());
  return c;
}
const head = (title: string, lead?: string) => {
  el('h1', '', title, main);
  if (lead) inline(lead, el('p', 'site__lead', '', main));
  document.title = `${title} · Optikos`;
};
const card = (parent: HTMLElement, title: string, text: string, icon: string | undefined, onClick: () => void) => {
  const b = el('button', 'site__card', '', parent);
  if (icon) b.append(iconEl(icon));
  el('b', '', title, b);
  el('span', '', text, b);
  b.addEventListener('click', onClick);
  return b;
};

// ---- home ---------------------------------------------------------------------------------------
function home() {
  document.title = 'Optikos';
  const hero = el('section', 'home__hero', '', main);
  const inner = el('div', 'home__heroInner', '', hero);
  const copyCol = el('div', '', '', inner);
  el('span', 'site__chip site__chip--accent', t('heroEyebrow', { version: data.version }), copyCol);
  el('h1', '', t('heroTitle'), copyCol);
  el('p', '', t('heroLead'), copyCol);
  const actions = el('div', 'home__actions', '', copyCol);
  own(create({ type: 'button', text: t('getStarted'), variant: 'primary', icon: 'chevron-right', iconPos: 'right', renderTo: actions, handler: () => go('g/getting-started') } as never));
  own(create({ type: 'button', text: t('browseComponents'), renderTo: actions, handler: () => go('components') } as never));
  const install = el('div', 'home__install', '', actions);
  install.append('npm i ', Object.assign(document.createElement('b'), { textContent: 'optikos' }));
  own(create({ type: 'button', icon: 'file', variant: 'ghost', ariaLabel: t('copyInstall'), tooltip: t('copyInstall'), renderTo: install, handler: () => void copy('npm i optikos') } as never));

  // a real form, not a picture of one
  const live = el('div', 'home__live', '', inner);
  el('span', 'site__chip site__chip--accent home__liveTag', t('tryIt'), live);
  const form: Form = ui.form([
    ui.text('name', 'Name', { required: true, minLength: 3 }),
    ui.email('email', 'Email', { required: true }),
    ui.grid(2, ui.select('plan', 'Plan', ['Free', 'Team', 'Business'], { value: 'Team' }), ui.date('since', 'Since')),
    ui.slider('seats', 'Seats', { min: 1, max: 50, value: 12, showValue: 'always' }),
  ]);
  own(create({ type: 'panel', title: t('newCustomer'), icon: 'user', renderTo: live, items: [form], buttons: [{ text: t('save'), variant: 'primary', handler: () => form.validate() && toast({ type: 'success', text: t('saved', { name: String(form.getValues().name) }) }) }] } as never));

  const stats = el('section', 'home__stats', '', main);
  for (const [n, key] of [['0', 'statDeps'], [String(documented.length), 'statComponents'], [String(data.sizes.core), 'statCore'], [String(data.themes.length), 'statThemes'], [String(Object.keys(data.tokens).length), 'statTokens']] as [string, Key][]) {
    const s = el('div', 'home__stat', '', stats);
    el('b', '', n, s);
    el('span', '', t(key), s);
  }

  const section = (title: Key, text?: Key) => {
    const s = el('section', 'home__section', '', main);
    el('h2', '', t(title), s);
    if (text) el('p', '', t(text), s);
    return s;
  };
  const pillars = el('div', 'site__grid', '', section('pillarsTitle'));
  for (const [icon, key] of [['sparkles', 'fast'], ['box', 'light'], ['columns', 'complete'], ['sun', 'theme'], ['user', 'a11y'], ['plus', 'ext']]) {
    const p = el('div', 'home__pillar', '', pillars);
    p.append(iconEl(icon));
    const txt = el('div', '', '', p);
    el('b', '', t(`p_${key}` as Key), txt);
    el('span', '', t(`p_${key}Text` as Key), txt);
  }

  const themes = section('themesTitle', 'themesText');
  const chips = el('div', 'home__themes', '', themes);
  const mark = (theme: string) => chips.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
  for (const theme of PUBLIC_THEMES) {
    const b = el('button', 'home__theme', theme, chips);
    b.type = 'button';
    b.dataset.theme = theme;
    b.addEventListener('click', () => themeSelect.setValue(theme));
  }
  mark(String(themeSelect.getValue()));
  themeListeners.add(mark);
  cleanups.push(() => themeListeners.delete(mark));

  const split = el('div', 'home__split', '', section('codeTitle', 'codeText'));
  const people = [['Ada Lovelace', 'Engineer', 1280.5], ['Grace Hopper', 'Admiral', 9400], ['Alan Turing', 'Researcher', 780], ['Katherine Johnson', 'Mathematician', 640], ['Linus Torvalds', 'Maintainer', 310.25], ['Margaret Hamilton', 'Director', 5120], ['Hedy Lamarr', 'Inventor', 2210]];
  const code = `create({
  type: 'grid', paging: true, pageSize: 5, height: 300,
  renderTo: document.body,
  columns: [
    { field: 'name', header: 'Name', flex: 1, sortable: true },
    { field: 'role', header: 'Role' },
    { field: 'total', header: 'Total', format: 'money', align: 'right', sortable: true },
  ],
  data: people, // [{ name: 'Ada Lovelace', role: 'Engineer', total: 1280.5 }, ...]
});`;
  split.append(codeBlock(code));
  const result = el('div', '', '', split);
  own(create({
    type: 'grid', paging: true, pageSize: 5, height: 300, renderTo: result, ariaLabel: 'People',
    columns: [{ field: 'name', header: 'Name', flex: 1, sortable: true }, { field: 'role', header: 'Role' }, { field: 'total', header: 'Total', format: 'money', align: 'right', sortable: true }],
    data: people.map(([name, role, total]) => ({ name, role, total })),
  } as never));

  const rs = section('recipesTitle', 'recipesText');
  const rGrid = el('div', 'site__grid', '', rs);
  for (const r of recipes.slice(0, 6)) card(rGrid, tx(r.title), tx(r.intro).replace(/`/g, ''), r.icon, () => go(`r/${r.id}`));

  const ds = section('demosTitle', 'demosText');
  const dGrid = el('div', 'site__grid', '', ds);
  for (const d of DEMOS.slice(0, 6)) card(dGrid, tx(d.title), tx(d.text), d.icon, () => void open(demoUrl(d.name), '_blank'));
  const more = el('p', '', '', ds);
  own(create({ type: 'button', text: t('seeAll'), icon: 'chevron-right', iconPos: 'right', variant: 'ghost', renderTo: more, handler: () => go('demos') } as never));

  const foot = el('footer', 'home__footer', '', main);
  el('span', '', t('footer'), foot);
  Object.assign(el('a', '', 'GitHub', foot), { href: data.repo });
  Object.assign(el('a', '', 'npm', foot), { href: 'https://www.npmjs.com/package/optikos' });
}

// ---- components ---------------------------------------------------------------------------------
function componentsIndex() {
  head(t('components'), t('componentsLead'));
  for (const [cat, list] of sorted) {
    el('h2', '', label(cat), main);
    const grid = el('div', 'site__grid', '', main);
    for (const c of list) card(grid, sheet(c).title, sheet(c).summary.replace(/[`*]/g, '').slice(0, 120), undefined, () => go(`c/${c.name}`));
  }
}

// spec sheet sections grouped in tabs (keys are per language; CANON maps the Portuguese ones)
const CANON: Record<string, string> = { 'Propósito': 'Purpose', Anatomia: 'Anatomy', Eventos: 'Events', Estados: 'States', 'Teclado/ARIA': 'Keyboard/ARIA', 'Casos sandbox': 'Sandbox cases', 'Fora do escopo': 'Out of scope' };
const GROUP: Record<string, Key> = { Anatomy: 'anatomy', Tokens: 'anatomy', 'Keyboard/ARIA': 'accessibility', 'Sandbox cases': 'scope', 'Out of scope': 'scope' };

function component(c: Comp) {
  const doc = sheet(c);
  const layout = el('div', 'page__layout', '', main);
  const body = el('div', '', '', layout);
  const toc = el('nav', 'page__toc', '', layout);
  toc.setAttribute('aria-label', t('onThisPage'));
  el('b', '', t('onThisPage'), toc);
  const tocLink = (text: string, target: HTMLElement) => {
    const a = Object.assign(el('a', '', text, toc), { href: '#' });
    a.addEventListener('click', (e) => (e.preventDefault(), target.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  };

  el('h1', '', doc.title, body);
  document.title = `${doc.title} · Optikos`;
  const chips = el('div', 'site__chips', '', body);
  if (c.type) el('span', 'site__chip site__chip--accent', `type: '${c.type}'`, chips);
  el('span', 'site__chip', label(c.category), chips);
  if (data.sizes.components[c.name]) el('span', 'site__chip', t('size', { kb: data.sizes.components[c.name] }), chips);
  if (!c.docs[lang]) el('p', 'site__lead', t('onlyIn', { lang: langName(Object.keys(c.docs)[0]) }), body);
  inline(doc.summary, el('p', 'site__lead', '', body));

  const exHead = el('h2', '', t('examples'), body);
  tocLink(t('examples'), exHead);
  c.examples.forEach((ex) => {
    const box = example(ex, body);
    tocLink(`· ${tx(ex.title)}`, box);
  });

  const sheetHead = el('h2', '', t('sheet'), body);
  tocLink(t('sheet'), sheetHead);
  const groups = new Map<Key, [string, string][]>();
  for (const [k, v] of Object.entries(doc.fields)) {
    const g = GROUP[CANON[k] ?? k] ?? 'usage';
    groups.set(g, [...(groups.get(g) ?? []), [k, v]]);
  }
  const panels = (['usage', 'anatomy', 'accessibility', 'scope'] as Key[]).filter((g) => groups.has(g)).map((g) => {
    const panel = new Container({ title: t(g) } as never);
    const dl = el('dl', 'sheet', '', panel.el);
    for (const [k, v] of groups.get(g)!) {
      el('dt', '', k, dl);
      inline(v, el('dd', '', '', dl));
    }
    return panel;
  });
  own(create({ type: 'tabs', renderTo: body, cls: 'example', items: panels, lazy: false } as never));
  const more = el('p', '', '', body);
  inline(`${t('moreSandbox')} [sandbox/${c.category}](${sandboxLink(c.category)})`, more);
}

function example(ex: Example, parent: HTMLElement): HTMLElement {
  const box = el('section', 'example', '', parent);
  const header = el('header', '', '', box);
  el('h3', '', tx(ex.title), header);
  if (ex.description) el('p', '', tx(ex.description), header);
  if (!ex.config) {
    const pad = el('div', 'example__code', '', box);
    pad.append(codeBlock(ex.code ?? ''));
    if (ex.demo) inline(`${t('runningExample')} [${ex.demo}](${exampleLink(ex.demo)})`, el('p', '', '', pad));
    return box;
  }
  const result = new Container({ title: t('result'), cls: 'example__stage' } as never);
  const codePanel = new Container({ title: t('code'), cls: 'example__code' } as never);
  const original = JSON.stringify(ex.config, null, 2);
  const area = el('textarea', '', '', codePanel.el);
  area.value = original;
  area.spellcheck = false;
  area.setAttribute('aria-label', `${t('configOf')} ${tx(ex.title)}`);
  const bar = el('div', 'example__bar', '', codePanel.el);
  const err = el('span', 'example__err', '', bar);
  let stop = () => {};
  const tabs = own(create({ type: 'tabs', renderTo: box, items: [result, codePanel], lazy: false } as never)) as unknown as { setActive(i: number): void };
  const apply = (show = true) => {
    stop();
    stop = () => {};
    err.textContent = '';
    try {
      stop = run(ex, JSON.parse(area.value), result.el);
      if (show) tabs.setActive(0);
    } catch (e) {
      err.textContent = String((e as Error).message);
    }
  };
  create({ type: 'button', text: t('apply'), variant: 'primary', renderTo: bar, handler: () => apply() } as never);
  create({ type: 'button', text: t('reset'), renderTo: bar, handler: () => { area.value = original; apply(); } } as never);
  create({ type: 'button', text: t('copy'), icon: 'file', variant: 'ghost', renderTo: bar, handler: () => void copy(snippet(ex, JSON.parse(area.value))) } as never);
  area.addEventListener('keydown', (e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && apply());
  apply(false);
  cleanups.push(() => stop());
  return box;
}

// ---- recipes and demos --------------------------------------------------------------------------
function recipesIndex() {
  head(t('recipes'), t('recipesLead'));
  const grid = el('div', 'site__grid', '', main);
  for (const r of recipes) card(grid, tx(r.title), tx(r.intro).replace(/`/g, ''), r.icon, () => go(`r/${r.id}`));
}

function recipe(r: Recipe) {
  head(tx(r.title), tx(r.intro));
  const stage = el('div', 'recipe__stage', '', main);
  cleanups.push(r.mount(stage));
  el('h2', '', t('whatToNotice'), main);
  const notes = el('ul', 'recipe__notes', '', main);
  for (const n of r.notes) {
    const li = el('li', '', '', notes);
    li.append(iconEl('check'));
    inline(tx(n), el('span', '', '', li));
  }
  el('h2', '', t('code'), main);
  main.append(codeBlock(data.recipes[r.id] ?? '', `site/recipes/${r.id}.ts`));
}

function demosPage() {
  head(t('demos'), t('demosLead'));
  const grid = el('div', 'site__grid', '', main);
  grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(19rem,1fr))';
  for (const d of DEMOS.filter((x) => data.demos.includes(x.name))) {
    const box = el('article', 'demo', '', grid);
    const shot = el('div', 'demo__shot', '', box);
    const frame = Object.assign(el('iframe', '', '', shot), { src: demoUrl(d.name), title: tx(d.title), loading: 'lazy', tabIndex: -1 });
    frame.setAttribute('aria-hidden', 'true');
    const body = el('div', 'demo__body', '', box);
    el('b', '', tx(d.title), body);
    el('p', '', tx(d.text), body);
    const actions = el('div', 'demo__actions', '', body);
    own(create({ type: 'button', text: t('openDemo'), variant: 'primary', icon: 'chevron-right', iconPos: 'right', renderTo: actions, handler: () => void open(demoUrl(d.name), '_blank') } as never));
    own(create({ type: 'button', text: t('viewCode'), variant: 'ghost', renderTo: actions, handler: () => void open(`${data.repo}/tree/main/demos/${d.name}`, '_blank') } as never));
  }
}

// ---- guides, tokens, MCP ------------------------------------------------------------------------
function guide(name: string) {
  const g = data.guides.find((x) => x.name === name);
  if (!g) return void el('p', '', t('guideMissing'), main);
  document.title = `${guideText(g).title} · Optikos`;
  if (!g.i18n[lang]) el('p', 'site__lead', t('onlyIn', { lang: langName(Object.keys(g.i18n)[0]) }), main);
  main.append(markdown(guideText(g).markdown));
}

function tokens(query = '') {
  head(t('tokens'), t('tokensLead'));
  el('h2', '', t('themes'), main);
  inline(data.themes.map((x) => `\`${x}\``).join(' · ') + ' ' + t('themesCombine'), el('p', '', '', main));
  el('h2', '', 'Tokens', main);
  const find = own(create({ type: 'textfield', placeholder: t('filterTokens'), clearable: true, ariaLabel: t('filterTokens'), value: query, renderTo: main } as never));
  const table = el('table', 'site__tokens', '', main);
  const rows = Object.entries(data.tokens).map(([k, v]) => {
    const tr = el('tr', '', '', table);
    Object.assign(el('td', '', k, tr).style, { fontFamily: 'var(--op-font-mono)', fontSize: '.85em' });
    const td = el('td', '', '', tr);
    // the swatch shows the live value in the current theme, not the base default
    if (/^(#|rgb|hsl|var\(--op-(color|[a-z]+-\d))/.test(v)) Object.assign(el('span', '', '', td).style, { display: 'inline-block', inlineSize: '1em', blockSize: '1em', borderRadius: '3px', border: '1px solid var(--op-color-border)', verticalAlign: '-.15em', marginInlineEnd: '.4em', background: `var(${k})` });
    td.append(v);
    return { tr, k };
  });
  const apply = (q: string) => rows.forEach(({ tr, k }) => (tr.hidden = !k.includes(q.trim())));
  (find as unknown as { on(e: string, fn: (v: string) => void): void }).on('change', (q) => apply(q ?? ''));
  apply(query);
}

function mcp() {
  head(t('mcp'), t('mcpLead'));
  el('h2', '', t('connect'), main);
  inline(t('mcpConnect'), el('p', '', '', main));
  main.append(codeBlock(JSON.stringify({ mcpServers: { optikos: { command: 'node', args: ['scripts/mcp.mjs'], cwd: '<path to the optikos repo>' } } }, null, 2), 'JSON'));
  inline(t('mcpRun'), el('p', '', '', main));
  el('h2', '', t('tools'), main);
  const table = el('table', '', '', main);
  for (const [n, d] of [
    ['list_components', 'name, type, category, purpose'],
    ['get_component', 'the full spec sheet'],
    ['get_examples', 'runnable example configs'],
    ['search_docs', 'spec sheets and guides'],
    ['get_guide', 'theming, ui, motion, catalog, performance, architecture'],
    ['get_tokens', '--op-* tokens with defaults'],
    ['list_themes', 'the shipped themes'],
  ]) {
    const tr = el('tr', '', '', table);
    el('td', '', n, tr).style.fontFamily = 'var(--op-font-mono)';
    el('td', '', `${d} · lang: en | pt-BR`, tr);
  }
}

route();
