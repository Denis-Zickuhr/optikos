import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { toLayer, lockModal } from '../../../core/layer';
import { trapFocus } from '../../../core/focus';
import { iconEl } from '../../base/icon/icon';

addMessages('en', {
  cpPlaceholder: 'Type a command or search…',
  cpLabel: 'Command palette',
  cpFilters: 'Categories',
  cpAll: 'All',
  cpEmpty: 'No matching commands',
  cpHint: '↑↓ navigate · Enter run · Esc close',
});
addMessages('pt-BR', {
  cpPlaceholder: 'Digite um comando ou pesquise…',
  cpLabel: 'Paleta de comandos',
  cpFilters: 'Categorias',
  cpAll: 'Todas',
  cpEmpty: 'Nenhum comando encontrado',
  cpHint: '↑↓ navegar · Enter executar · Esc fechar',
});

export interface Command {
  id: string;
  title: string;
  /** Groups the command and gives it a filter chip. */
  category?: string;
  icon?: string;
  description?: string;
  /** Extra words that find the command. */
  keywords?: string[];
  /** Only displayed (the app binds the key itself). */
  shortcut?: string;
  disabled?: boolean;
  hidden?: () => boolean;
  /** Runs after the palette closed. Errors become the palette's `error` event. */
  handler?: (ctx: { palette: CommandPalette; command: Command }) => unknown;
  /** A second level: choosing this command shows these (Backspace on an empty field goes back). */
  children?: Command[] | (() => Command[] | Promise<Command[]>);
}

export interface CommandPaletteConfig extends ComponentConfig {
  commands?: Command[];
  /** `mod` is Ctrl on Windows/Linux and ⌘ on macOS. `false` turns the global key off. Default `'mod+k'`. */
  hotkey?: string | false;
  placeholder?: string;
  emptyText?: string;
  maxResults?: number;
  /** Order of the category groups; the others follow. */
  categories?: string[];
  /** Category chips under the field. Default true. */
  filters?: boolean;
}

type Level = { title: string; commands: Command[] };

const isMac = () => /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

function matchesKey(e: KeyboardEvent, spec: string): boolean {
  const parts = spec.toLowerCase().split('+');
  const key = parts.pop()!;
  const has = (m: string) => parts.includes(m);
  const mac = isMac();
  return (
    e.key.toLowerCase() === key &&
    e.ctrlKey === (has('ctrl') || (has('mod') && !mac)) &&
    e.metaKey === (has('meta') || (has('mod') && mac)) &&
    e.shiftKey === has('shift') &&
    e.altKey === has('alt')
  );
}

const subsequence = (text: string, q: string) => {
  let i = 0;
  for (const ch of text) if (ch === q[i] && ++i === q.length) return true;
  return !q.length;
};

/** How well a command answers the query (0 = not at all). Every word of the query must match somewhere. */
function score(c: Command, query: string): number {
  const title = c.title.toLowerCase();
  const rest = [c.category, c.description, ...(c.keywords ?? [])].join(' ').toLowerCase();
  let total = 0;
  for (const w of query.toLowerCase().split(/\s+/).filter(Boolean)) {
    const at = title.indexOf(w);
    const s = at === 0 ? 100 : at > 0 ? (/[\s\-_/]/.test(title[at - 1]) ? 80 : 60) : w.length > 2 && subsequence(title, w) ? 30 : rest.includes(w) ? 20 : 0;
    if (!s) return 0;
    total += s;
  }
  return total;
}

/** Title with the matched words marked. */
function marked(title: string, query: string): Array<string | Node> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lower = title.toLowerCase();
  const spans: Array<[number, number]> = [];
  for (const w of words) {
    const at = lower.indexOf(w);
    if (at >= 0) spans.push([at, at + w.length]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  const out: Array<string | Node> = [];
  let pos = 0;
  for (const [a, b] of spans) {
    if (a < pos) continue;
    out.push(title.slice(pos, a), h('mark', 'op-palette__mark', {}, title.slice(a, b)));
    pos = b;
  }
  out.push(title.slice(pos));
  return out.filter((x) => x !== '');
}

/**
 * Command palette: Ctrl/⌘+K opens a searchable, categorized list of the actions the app registered. Choosing one closes
 * the palette and runs it; a command with `children` opens a second level instead.
 */
export class CommandPalette extends Component<CommandPaletteConfig> {
  protected override baseCls = 'op-palette-backdrop';
  private commands: Command[];
  private levels: Level[] = [];
  private query = '';
  private cat: string | null = null;
  private shown: Command[] = [];
  private active = 0;
  private opened = false;
  private opener: Element | null = null;
  private release: Array<() => void> = [];
  private panel!: HTMLElement;
  private input!: HTMLInputElement;
  private filtersEl!: HTMLElement;
  private listEl!: HTMLElement;
  private live!: HTMLElement;
  private crumb!: HTMLElement;

  constructor(config: CommandPaletteConfig = {}) {
    super(config);
    this.commands = [...(config.commands ?? [])];
    const key = config.hotkey === undefined ? 'mod+k' : config.hotkey;
    if (key) {
      this.listen(document, 'keydown', (e: KeyboardEvent) => {
        if (!matchesKey(e, key) || this.destroyed) return;
        e.preventDefault();
        this.toggle();
      }, true);
    }
  }

  protected override build() {
    const c = this.config;
    this.input = h('input', 'op-palette__input', { type: 'text', role: 'combobox', 'aria-expanded': 'true', 'aria-autocomplete': 'list', autocomplete: 'off', spellcheck: 'false', placeholder: c.placeholder ?? t('cpPlaceholder') });
    this.crumb = h('span', 'op-palette__crumb');
    this.crumb.hidden = true;
    this.filtersEl = h('div', 'op-palette__filters', { role: 'group', 'aria-label': t('cpFilters') });
    this.listEl = h('div', 'op-palette__list', { role: 'listbox', id: `${this.id}-list` });
    this.input.setAttribute('aria-controls', this.listEl.id);
    this.live = h('div', 'op-sr-only', { 'aria-live': 'polite' });
    this.panel = h('div', 'op-palette', { role: 'dialog', 'aria-modal': 'true', 'aria-label': t('cpLabel') },
      h('div', 'op-palette__search', {}, iconEl('search'), this.crumb, this.input),
      this.filtersEl, this.listEl, this.live,
      h('div', 'op-palette__hint', {}, t('cpHint')));
    const el = h('div', 'op-palette-backdrop', {}, this.panel);
    this.listen(this.input, 'input', () => {
      this.query = this.input.value;
      this.active = 0;
      this.paint();
    });
    this.listen(this.panel, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.listen(el, 'pointerdown', (e: Event) => e.target === el && this.close());
    this.listen(this.listEl, 'pointermove', (e: Event) => {
      const i = this.indexOf(e);
      if (i >= 0 && i !== this.active) this.setActive(i);
    });
    this.listen(this.listEl, 'click', (e: Event) => {
      const i = this.indexOf(e);
      if (i >= 0) void this.choose(this.shown[i]);
    });
    this.listen(this.filtersEl, 'click', (e: Event) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-cat]');
      if (!b) return;
      this.cat = b.dataset.cat || null;
      this.active = 0;
      this.paint();
      this.input.focus();
    });
    return el;
  }

  // ---- commands ------------------------------------------------------------------------------

  getCommands(): Command[] {
    return this.commands;
  }
  setCommands(list: Command[]): void {
    this.commands = [...list];
    if (this.levels[0]) this.levels[0].commands = this.commands;
    if (this.opened) this.paint();
  }
  /** Adds commands; returns the function that removes them again. */
  register(cmd: Command | Command[]): () => void {
    const list = Array.isArray(cmd) ? cmd : [cmd];
    this.commands.push(...list);
    if (this.opened) this.paint();
    return () => this.setCommands(this.commands.filter((c) => !list.includes(c)));
  }
  /** Runs a command by id (searching every level that is not a submenu), without opening the palette. */
  run(id: string): Promise<void> {
    const c = this.commands.find((x) => x.id === id);
    return c ? this.exec(c) : Promise.resolve();
  }

  // ---- open / close --------------------------------------------------------------------------

  isOpen(): boolean {
    return this.opened;
  }
  toggle(): void {
    if (this.opened) this.close();
    else this.open();
  }

  open(): void {
    if (this.opened || this.destroyed || this.emit('before-open') === false) return;
    this.opener = document.activeElement;
    const el = this.el;
    this.levels = [{ title: '', commands: this.commands }];
    this.query = this.input.value = '';
    this.cat = null;
    this.active = 0;
    toLayer(el, this.opener);
    this.release.push(lockModal(el), trapFocus(this.panel));
    this.opened = true;
    el.classList.add('is-open');
    this.notifyMount();
    this.paint();
    this.input.focus();
    this.emit('open');
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    this.release.splice(0).reverse().forEach((f) => f());
    this.el.classList.remove('is-open');
    this.el.remove();
    if (this.opener instanceof HTMLElement && this.opener.isConnected) this.opener.focus();
    this.emit('close');
  }

  protected override onDestroy(): void {
    this.opened = false;
    this.release.splice(0).forEach((f) => f());
    if (this.panel) this.el.remove();
  }

  // ---- rendering -----------------------------------------------------------------------------

  private level(): Level {
    return this.levels[this.levels.length - 1];
  }

  /** Commands for the current query/filter, in display order. */
  private results(): Command[] {
    const pool = this.level().commands.filter((c) => !c.hidden?.() && (!this.cat || c.category === this.cat));
    const q = this.query.trim();
    if (q) {
      return pool
        .map((c) => ({ c, s: score(c, q) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.c)
        .slice(0, this.config.maxResults ?? 50);
    }
    const order = this.config.categories ?? [];
    const rank = (c: Command) => (c.category === undefined ? 1e6 : order.includes(c.category) ? order.indexOf(c.category) : order.length);
    return pool.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c) - rank(b.c) || a.i - b.i).map((x) => x.c).slice(0, this.config.maxResults ?? 50);
  }

  private paint(): void {
    const lvl = this.level();
    this.crumb.hidden = this.levels.length < 2;
    this.crumb.textContent = lvl.title;
    this.paintFilters();
    this.shown = this.results();
    this.active = Math.min(this.active, Math.max(0, this.shown.length - 1));
    const searching = !!this.query.trim();
    const rows: HTMLElement[] = [];
    let group: string | undefined;
    this.shown.forEach((c, i) => {
      if (!searching && c.category !== group) {
        group = c.category;
        if (group) rows.push(h('div', 'op-palette__group', { role: 'presentation' }, group));
      }
      const item = h('div', `op-palette__item${c.disabled ? ' is-disabled' : ''}`, { role: 'option', id: `${this.id}-o${i}`, 'aria-disabled': c.disabled ? 'true' : null, 'data-i': i },
        c.icon ? h('span', 'op-palette__icon', {}, iconEl(c.icon)) : h('span', 'op-palette__icon'),
        h('span', 'op-palette__text', {}, h('span', 'op-palette__title', {}, ...marked(c.title, this.query)), c.description ? h('span', 'op-palette__desc', {}, c.description) : ''),
        searching && c.category ? h('span', 'op-palette__cat', {}, c.category) : '',
        c.children ? h('span', 'op-palette__more', { 'aria-hidden': 'true' }, iconEl('chevron-right')) : '',
        c.shortcut ? h('kbd', 'op-palette__kbd', {}, c.shortcut) : '');
      rows.push(item);
    });
    if (!this.shown.length) rows.push(h('div', 'op-palette__empty', {}, this.config.emptyText ?? t('cpEmpty')));
    this.listEl.replaceChildren(...rows);
    this.live.textContent = this.shown.length ? t('results', { n: this.shown.length }) : t('noResults');
    this.setActive(this.active, false);
  }

  private paintFilters(): void {
    const cats = [...new Set(this.level().commands.filter((c) => !c.hidden?.() && c.category).map((c) => c.category!))];
    this.filtersEl.hidden = this.config.filters === false || cats.length < 2;
    if (this.cat && !cats.includes(this.cat)) this.cat = null;
    const chip = (label: string, cat: string) => h('button', `op-palette__chip${(this.cat ?? '') === cat ? ' is-on' : ''}`, { type: 'button', 'data-cat': cat, 'aria-pressed': String((this.cat ?? '') === cat) }, label);
    this.filtersEl.replaceChildren(chip(t('cpAll'), ''), ...cats.map((c) => chip(c, c)));
  }

  private indexOf(e: Event): number {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.op-palette__item');
    return row ? Number(row.dataset.i) : -1;
  }

  private setActive(i: number, scroll = true): void {
    this.active = i;
    for (const row of Array.from(this.listEl.querySelectorAll<HTMLElement>('.op-palette__item'))) {
      const on = Number(row.dataset.i) === i;
      row.classList.toggle('is-active', on);
      row.setAttribute('aria-selected', String(on));
      if (on) {
        this.input.setAttribute('aria-activedescendant', row.id);
        if (scroll) row.scrollIntoView?.({ block: 'nearest' });
      }
    }
    if (!this.shown.length) this.input.removeAttribute('aria-activedescendant');
  }

  // ---- behavior ------------------------------------------------------------------------------

  private onKey(e: KeyboardEvent): void {
    const n = this.shown.length;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        e.preventDefault();
        if (n) this.setActive((this.active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
        break;
      case 'Home':
      case 'End':
        if (e.target === this.input && !this.input.value) {
          e.preventDefault();
          if (n) this.setActive(e.key === 'Home' ? 0 : n - 1);
        }
        break;
      case 'Enter':
        if ((e.target as HTMLElement).closest('.op-palette__chip')) return;
        e.preventDefault();
        if (this.shown[this.active]) void this.choose(this.shown[this.active]);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        if (this.levels.length > 1) this.back();
        else this.close();
        break;
      case 'Backspace':
        if (!this.input.value && this.levels.length > 1) {
          e.preventDefault();
          this.back();
        }
        break;
    }
  }

  private back(): void {
    this.levels.pop();
    this.query = this.input.value = '';
    this.cat = null;
    this.active = 0;
    this.paint();
    this.input.focus();
  }

  private async choose(c: Command | undefined): Promise<void> {
    if (!c || c.disabled) return;
    if (c.children) {
      try {
        const kids = typeof c.children === 'function' ? await c.children() : c.children;
        this.levels.push({ title: c.title, commands: kids });
        this.query = this.input.value = '';
        this.cat = null;
        this.active = 0;
        this.paint();
        this.input.focus();
      } catch (err) {
        this.emit('error', err);
      }
      return;
    }
    this.close();
    await this.exec(c);
  }

  private async exec(c: Command): Promise<void> {
    try {
      this.emit('run', c);
      await c.handler?.({ palette: this, command: c });
    } catch (err) {
      this.emit('error', err);
    }
  }
}
register('commandpalette', CommandPalette);
