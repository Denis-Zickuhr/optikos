import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { FilterGroup, Sorter } from '../../../data/proxy';
import { Button } from '../../base/button/button';
import { Menu, type MenuEntry } from '../../overlays/menu/menu';
import { MessageBox } from '../../overlays/messagebox/messagebox';
import type { Grid, ColumnState } from '../grid/grid';
import type { FilterBuilder } from '../filterbuilder/filterbuilder';

addMessages('en', {
  views: 'Views',
  viewsName: 'Name for this view',
  viewsSave: 'Save view',
  viewsSaveAs: 'Save as new view…',
  viewsDefault: 'Open with this view',
  viewsDelete: 'Delete view',
  viewsConfirmDelete: 'Delete the view "{n}"?',
  viewsReset: 'Reset to initial',
});
addMessages('pt-BR', {
  views: 'Visões',
  viewsName: 'Nome desta visão',
  viewsSave: 'Salvar visão',
  viewsSaveAs: 'Salvar como nova visão…',
  viewsDefault: 'Abrir com esta visão',
  viewsDelete: 'Excluir visão',
  viewsConfirmDelete: 'Excluir a visão "{n}"?',
  viewsReset: 'Voltar ao inicial',
});

/** Everything a view remembers: plain JSON, so it can travel to any backend. */
export interface ViewState {
  columns?: ColumnState[];
  filter?: FilterGroup | null;
  sorters?: Sorter[];
  /** Whatever the app registered in `extra` (panel collapsed, density...). */
  extra?: Record<string, unknown>;
}
export interface SavedView {
  id?: string;
  name: string;
  default?: boolean;
  state: ViewState;
}

/** Where views live. Implement it for your endpoint; `localViewStorage` and `restViewStorage` are ready-made. */
export interface ViewStorage {
  list(): Promise<SavedView[]> | SavedView[];
  /** Create (no `id`) or update. May return the stored view (with the id the server gave it). */
  save(view: SavedView): Promise<SavedView | void> | SavedView | void;
  remove(view: SavedView): Promise<void> | void;
}

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Views in the browser (`localStorage` by default) under one key. */
export function localViewStorage(key: string, storage: Storage = localStorage): ViewStorage {
  const read = (): SavedView[] => {
    try {
      const v = JSON.parse(storage.getItem(key) ?? '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  const write = (v: SavedView[]) => storage.setItem(key, JSON.stringify(v));
  return {
    list: read,
    save(view) {
      const saved = { ...view, id: view.id ?? newId() };
      const all = read();
      const i = all.findIndex((x) => x.id === saved.id);
      if (i < 0) all.push(saved);
      else all[i] = saved;
      write(all);
      return saved;
    },
    remove(view) {
      write(read().filter((x) => x.id !== view.id));
    },
  };
}

export interface RestViewStorageConfig {
  /** `GET url` lists, `POST url` creates, `PUT url/:id` updates, `DELETE url/:id` removes. JSON in and out. */
  url: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

/** Views on your server. Responses must be JSON (the list as an array, create/update returning the stored view). */
export function restViewStorage(cfg: RestViewStorageConfig): ViewStorage {
  const call = async (method: string, path = '', body?: unknown) => {
    const res = await (cfg.fetch ?? fetch)(cfg.url + path, { method, headers: { 'Content-Type': 'application/json', ...cfg.headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (!res.ok) throw new Error(`Optikos views: ${method} ${cfg.url + path} → ${res.status}`);
    return res.status === 204 ? undefined : res.json().catch(() => undefined);
  };
  return {
    list: () => call('GET'),
    save: (v) => (v.id ? call('PUT', `/${encodeURIComponent(v.id)}`, v) : call('POST', '', v)),
    remove: (v) => call('DELETE', `/${encodeURIComponent(v.id!)}`).then(() => undefined),
  };
}

export interface ViewManagerConfig extends ComponentConfig {
  grid: Grid;
  /** Its filter tree is part of the view. */
  filters?: FilterBuilder;
  storage: ViewStorage;
  /** Extra things to remember: `{ density: { get: () => ..., set: (v) => ... } }`. Stored in `state.extra`. */
  extra?: Record<string, { get(): unknown; set(value: unknown): void }>;
  /** Apply the default view when it opens. Default true. */
  autoLoad?: boolean;
}

/**
 * "Views" button for a Grid (and its FilterBuilder): saves and restores the visible columns and their order, the filters
 * (including nested AND/OR groups) and the sort, under a name, in the storage you give it.
 */
export class ViewManager extends Component<ViewManagerConfig> {
  protected override baseCls = 'op-viewmanager';
  private btn!: Button;
  private menu?: Menu;
  private views: SavedView[] = [];
  private current?: SavedView;
  private initial: ViewState = {};

  protected override build() {
    this.btn = new Button({ text: t('views'), icon: 'menu', variant: 'ghost', handler: () => this.openMenu() });
    this.btn.el.setAttribute('aria-haspopup', 'menu');
    this.own(() => (this.btn.destroy(), this.menu?.destroy()));
    return h('span', this.baseCls, {}, this.btn.el);
  }

  protected override onRender() {
    this.config.grid.render();
    this.config.filters?.render();
    this.initial = this.getState();
    if (this.config.autoLoad !== false) void this.reload();
  }

  override notifyMount() {
    super.notifyMount();
    this.btn.notifyMount();
  }

  // ---- state ---------------------------------------------------------------------------------

  /** The grid's and filter's current setup. */
  getState(): ViewState {
    const { grid, filters, extra } = this.config;
    const state: ViewState = { columns: grid.getColumnState(), filter: filters?.getFilter() ?? null, sorters: [...grid.getStore().getSorters()] };
    if (extra) state.extra = Object.fromEntries(Object.entries(extra).map(([k, e]) => [k, e.get()]));
    return state;
  }

  /** Puts a setup on the grid and the filter. */
  setState(s: ViewState): void {
    const { grid, filters, extra } = this.config;
    if (s.columns) grid.setColumnState(s.columns);
    const sort = s.sorters?.[0];
    grid.getStore().sort(sort?.field ?? null, sort?.dir);
    if (filters) {
      filters.setFilter(s.filter ?? null);
      filters.apply();
    }
    for (const k in s.extra) extra?.[k]?.set(s.extra[k]);
  }

  // ---- views ---------------------------------------------------------------------------------

  getViews(): SavedView[] {
    return this.views;
  }
  getCurrent(): SavedView | undefined {
    return this.current;
  }

  /** Reads the views from the storage and applies the default one (unless a view is already active). */
  async reload(): Promise<void> {
    await this.run(async () => {
      this.views = (await this.config.storage.list()) ?? [];
      this.current = this.current && this.views.find((v) => v.id === this.current!.id);
      const def = this.views.find((v) => v.default);
      if (!this.current && def && this.config.autoLoad !== false) this.apply(def);
      this.paint();
    });
    this.emit('load', this.views);
  }

  /** Applies a saved view (object or id). */
  apply(view: SavedView | string): void {
    const v = typeof view === 'string' ? this.views.find((x) => x.id === view) : view;
    if (!v || this.emit('before-apply', v) === false) return;
    this.current = v;
    this.setState(v.state);
    this.paint();
    this.emit('apply', v);
  }

  /** Saves the current setup into the active view; with none active, asks for a name first. */
  async save(): Promise<void> {
    if (!this.current) return this.saveAs();
    await this.store({ ...this.current, state: this.getState() });
  }

  /** Saves the current setup as a view with that name (asked for when omitted); an existing name is overwritten. */
  async saveAs(name?: string): Promise<void> {
    name ??= (await MessageBox.prompt(t('viewsName'), { title: t('viewsSaveAs') })) ?? '';
    name = name.trim();
    if (!name) return;
    const same = this.views.find((v) => v.name.toLowerCase() === name!.toLowerCase());
    await this.store({ ...same, name, state: this.getState() });
  }

  /** Marks the active view as the one applied on open (and unmarks the others). */
  async setDefault(on = true): Promise<void> {
    if (!this.current) return;
    for (const v of this.views) if (v !== this.current && v.default) await this.store({ ...v, default: false }, false);
    await this.store({ ...this.current, default: on });
  }

  async remove(view = this.current): Promise<void> {
    if (!view || !(await MessageBox.confirm(t('viewsConfirmDelete', { n: view.name }), { danger: true, okText: t('viewsDelete') }))) return;
    await this.run(async () => {
      await this.config.storage.remove(view);
      this.views = this.views.filter((v) => v !== view && v.id !== view.id);
      if (this.current?.id === view.id) this.current = undefined;
      this.paint();
      this.emit('remove', view);
    });
  }

  /** Back to the setup the grid had when the manager opened. */
  reset(): void {
    this.current = undefined;
    this.setState(this.initial);
    this.paint();
    this.emit('reset');
  }

  private async store(view: SavedView, makeCurrent = true): Promise<void> {
    await this.run(async () => {
      const saved = (await this.config.storage.save(view)) || view;
      const i = this.views.findIndex((v) => (saved.id && v.id === saved.id) || v === view);
      if (i < 0) this.views.push(saved);
      else this.views[i] = saved;
      if (makeCurrent) this.current = saved;
      this.paint();
      this.emit('save', saved);
    });
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.emit('error', err);
    }
  }

  // ---- UI ------------------------------------------------------------------------------------

  private paint(): void {
    this.btn.setText(this.current?.name ?? t('views'));
  }

  private openMenu(): void {
    const cur = this.current;
    const items: MenuEntry[] = [
      ...this.views.map((v) => ({ text: v.default ? `${v.name} ★` : v.name, checked: v === cur || (!!cur?.id && v.id === cur.id), handler: () => this.apply(v) })),
      ...(this.views.length ? (['-'] as const) : []),
      { text: t('viewsSave'), handler: () => void this.save() },
      { text: t('viewsSaveAs'), handler: () => void this.saveAs() },
      ...(cur ? [{ text: t('viewsDefault'), checked: !!cur.default, handler: () => void this.setDefault(!cur.default) }, { text: t('viewsDelete'), handler: () => void this.remove() }] : []),
      '-',
      { text: t('viewsReset'), handler: () => this.reset() },
    ];
    this.menu ??= new Menu({});
    this.menu.setItems(items);
    this.menu.showBy(this.btn.el);
  }
}
register('viewmanager', ViewManager);
