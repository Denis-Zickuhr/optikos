import { Emitter } from '../core/emitter';
import { Model, type ModelDef, type RecordOwner } from './model';
import type { FilterNode, FilterSpec, Proxy, ReadParams, ReadResult, Sorter } from './proxy';

export type StoreProxy<T> = Proxy<T> | ((params: ReadParams, signal?: AbortSignal) => Promise<ReadResult<T> | T[]> | ReadResult<T> | T[]);
export type FilterFn<T extends Record<string, any>> = (rec: Model<T>) => boolean;

/** One live change: `upsert` merges `data` into the record with the same id (or adds it), `remove` drops the record with `id`. */
export interface Patch<T> {
  op?: 'upsert' | 'remove';
  data?: Partial<T>;
  id?: string | number;
}
/** What `connect` needs from a source: an `EventSource` or a `WebSocket` both fit. */
export interface LiveSource {
  addEventListener(type: 'message', fn: (e: { data: any }) => void): void;
  removeEventListener(type: 'message', fn: (e: { data: any }) => void): void;
}

export interface StoreConfig<T extends Record<string, any>> {
  data?: Partial<T>[];
  model?: ModelDef;
  proxy?: StoreProxy<T>;
  /** 0 = no paging. */
  pageSize?: number;
  /** Sort, filter and paging are done by the proxy (it receives them in `read`). Default false: done locally. */
  remote?: boolean;
  sorters?: Sorter[];
  autoLoad?: boolean;
  listeners?: Record<string, (...a: any[]) => unknown>;
}

// One collator, made on first use: `localeCompare` with options builds a new one per call (100k rows: 5.4 s → 0.4 s).
let collator: Intl.Collator | undefined;
const cmp = (a: any, b: any) => (a == null ? (b == null ? 0 : 1) : b == null ? -1 : typeof a === 'string' && typeof b === 'string' ? (collator ??= new Intl.Collator(undefined, { numeric: true })).compare(a, b) : a < b ? -1 : a > b ? 1 : 0);

const text = (v: any) => String(v ?? '').toLowerCase();
const empty = (v: any) => v == null || v === '' || (Array.isArray(v) && !v.length);
const ISO = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;
/** Dates (Date objects or ISO strings) compare by time; anything else compares as is. */
const num = (v: any) => (v instanceof Date ? v.getTime() : typeof v === 'string' && ISO.test(v) ? Date.parse(v) : v);

function test(spec: FilterSpec, raw: any): boolean {
  const x = spec.value as any;
  const v = num(raw);
  const between = () => !empty(raw) && v >= num(x[0]) && v <= num(x[1]);
  const listed = () => (x as unknown[]).some((i) => num(i) == v);
  switch (spec.op ?? 'eq') {
    case 'eq': return v == num(x);
    case 'ne': return v != num(x);
    case 'contains': return text(raw).includes(text(x));
    case 'notContains': return !text(raw).includes(text(x));
    case 'startsWith': return text(raw).startsWith(text(x));
    case 'endsWith': return text(raw).endsWith(text(x));
    case 'gt': return v > num(x);
    case 'ge': return v >= num(x);
    case 'lt': return v < num(x);
    case 'le': return v <= num(x);
    case 'between': return between();
    case 'notBetween': return !between();
    case 'in': return listed();
    case 'nin': return !listed();
    case 'empty': return empty(raw);
    case 'notEmpty': return !empty(raw);
  }
}

/** Does a record's data satisfy a filter node? Groups are AND/OR; an empty group matches everything. */
export function matchFilter(node: FilterNode, data: Record<string, any>): boolean {
  if ('filters' in node) {
    if (!node.filters.length) return true;
    return node.op === 'or' ? node.filters.some((f) => matchFilter(f, data)) : node.filters.every((f) => matchFilter(f, data));
  }
  return test(node, data[node.field]);
}

/**
 * Records + a view over them (filtered, sorted, paged). Events: `load`, `before-load`, `load-error`, `add`, `remove`,
 * `update`, `sort`, `filter`, `page`, `sync`, and `change` for any of them (payload `{ type }`).
 */
export class Store<T extends Record<string, any> = Record<string, any>> extends Emitter implements RecordOwner {
  private all: Model<T>[] = [];
  private rows: Model<T>[] = [];
  private visible: Model<T>[] = [];
  private removed: Model<T>[] = [];
  private sorters: Sorter[];
  private filters: Array<FilterNode | FilterFn<T>> = [];
  private params: Record<string, unknown> = {};
  private proxy?: Proxy<T>;
  private pageNo = 1;
  private pageLen: number;
  private total = 0;
  private abort?: AbortController;
  loading = false;

  constructor(private cfg: StoreConfig<T> = {}) {
    super();
    this.sorters = cfg.sorters ?? [];
    this.pageLen = cfg.pageSize ?? 0;
    for (const k in cfg.listeners) this.on(k, cfg.listeners[k]);
    if (cfg.proxy) this.proxy = typeof cfg.proxy === 'function' ? { read: cfg.proxy } : cfg.proxy;
    if (cfg.data) this.setRecords(cfg.data.map((r) => this.wrap(r)), cfg.data.length);
    if (cfg.autoLoad && this.proxy) void this.load();
  }

  private get remote() {
    return !!this.cfg.remote && !!this.proxy;
  }
  private wrap(raw: Partial<T> | Model<T>): Model<T> {
    const m = raw instanceof Model ? raw : new Model<T>(raw, this.cfg.model);
    m.owner = this;
    return m;
  }
  private fire(type: string, ...args: unknown[]) {
    this.emit(type, ...args);
    this.emit('change', { type });
  }

  // ---- reading -------------------------------------------------------------------------------

  /** Number of records in the current view (the current page). */
  get count(): number {
    return this.visible.length;
  }
  /** Records matching the filters, across pages (remote: what the server reported). */
  get totalCount(): number {
    return this.remote ? this.total : this.rows.length;
  }
  /** Every record matching the filters, across pages (a remote store only knows the loaded page). */
  getFiltered(): Model<T>[] {
    return this.rows;
  }
  getAt(i: number): Model<T> | undefined {
    return this.visible[i];
  }
  getRange(start = 0, end = this.visible.length): Model<T>[] {
    return this.visible.slice(start, end);
  }
  getById(id: string | number): Model<T> | undefined {
    return this.all.find((r) => r.id === id);
  }
  indexOf(rec: Model<T>): number {
    return this.visible.indexOf(rec);
  }
  /** Plain data of the current view. */
  getData(): T[] {
    return this.visible.map((r) => r.data);
  }
  each(fn: (rec: Model<T>, i: number) => void): void {
    this.visible.forEach(fn);
  }

  // ---- loading -------------------------------------------------------------------------------

  /** Replaces all records with local data. */
  loadData(data: Partial<T>[]): void {
    this.removed = [];
    this.setRecords(data.map((r) => this.wrap(r)), data.length);
    this.fire('load');
  }

  /** Reads through the proxy. Extra `params` are sent to it and remembered for later reloads. A newer load cancels the older one. */
  async load(params?: Record<string, unknown>): Promise<void> {
    if (!this.proxy) throw new Error('Optikos Store: load() needs a proxy');
    if (params) this.params = params;
    const req: ReadParams = { ...this.params };
    if (this.remote) Object.assign(req, { page: this.pageNo, pageSize: this.pageLen || undefined, sorters: this.sorters, filters: this.filters.filter((f): f is FilterNode => typeof f !== 'function') });
    if (this.emit('before-load', req) === false) return;
    this.abort?.abort();
    const ctl = (this.abort = new AbortController());
    this.loading = true;
    this.emit('loading', true);
    try {
      const res = await this.proxy.read(req, ctl.signal);
      if (ctl.signal.aborted) return;
      const { data, total } = Array.isArray(res) ? { data: res, total: res.length } : res;
      this.removed = [];
      this.setRecords(data.map((r) => this.wrap(r)), total ?? data.length);
      this.loading = false;
      this.emit('loading', false);
      this.fire('load');
    } catch (err) {
      if (ctl.signal.aborted) return;
      this.loading = false;
      this.emit('loading', false);
      this.emit('load-error', err);
    }
  }

  /** Every record that matches the current sort and filters: a local store has them; a remote one is read page by page through its proxy. */
  async fetchAll(pageSize = 500): Promise<Model<T>[]> {
    if (!this.remote) return this.rows;
    const out: Model<T>[] = [];
    const base = { ...this.params, pageSize, sorters: this.sorters, filters: this.filters.filter((f): f is FilterNode => typeof f !== 'function') };
    for (let page = 1; ; page++) {
      const res = await this.proxy!.read({ ...base, page });
      const { data, total } = Array.isArray(res) ? { data: res, total: res.length } : res;
      out.push(...data.map((r) => new Model<T>(r, this.cfg.model)));
      if (!data.length || out.length >= (total ?? 0) || data.length < pageSize) return out;
    }
  }

  private setRecords(recs: Model<T>[], total: number) {
    this.all = recs;
    this.total = total;
    this.refreshView();
  }

  /** Recomputes filtered/sorted/paged rows from `all`. */
  private refreshView() {
    if (this.remote) {
      this.rows = this.visible = this.all;
      return;
    }
    let rows = this.all;
    if (this.filters.length) rows = rows.filter((r) => this.filters.every((f) => (typeof f === 'function' ? f(r) : matchFilter(f, r.data))));
    if (this.sorters.length) {
      rows = [...rows].sort((a, b) => {
        for (const s of this.sorters) {
          const d = cmp(a.data[s.field], b.data[s.field]);
          if (d) return s.dir === 'desc' ? -d : d;
        }
        return 0;
      });
    }
    this.rows = rows;
    const pages = this.pageCount;
    if (this.pageNo > pages) this.pageNo = pages;
    this.visible = this.pageLen ? rows.slice((this.pageNo - 1) * this.pageLen, this.pageNo * this.pageLen) : rows;
  }

  // ---- sort / filter / paging ----------------------------------------------------------------

  getSorters(): Sorter[] {
    return this.sorters;
  }
  /** `sort('name')` toggles asc/desc when already sorted by it; `sort('name', 'desc')` is explicit; `sort(null)` clears. */
  sort(field: string | null, dir?: 'asc' | 'desc'): void {
    const cur = this.sorters[0];
    this.sorters = field ? [{ field, dir: dir ?? (cur?.field === field && cur.dir === 'asc' ? 'desc' : 'asc') }] : [];
    this.pageNo = 1;
    this.changeView('sort');
  }

  /**
   * Replaces the filters (top level = AND). Accepts specs, groups (`{ op: 'or', filters }`), or a predicate.
   * Resolves when the view is up to date (for a remote store, after the reload).
   */
  filter(f: FilterNode | FilterNode[] | FilterFn<T>): Promise<void> {
    this.filters = Array.isArray(f) ? f : [f];
    this.pageNo = 1;
    return this.changeView('filter');
  }
  clearFilter(): Promise<void> {
    this.filters = [];
    this.pageNo = 1;
    return this.changeView('filter');
  }
  /** The active filter nodes (predicates are not included). */
  getFilters(): FilterNode[] {
    return this.filters.filter((f): f is FilterNode => typeof f !== 'function');
  }

  private changeView(type: string): Promise<void> {
    if (this.remote) return this.load();
    this.refreshView();
    this.fire(type);
    return Promise.resolve();
  }

  get page(): number {
    return this.pageNo;
  }
  get pageSize(): number {
    return this.pageLen;
  }
  get pageCount(): number {
    return this.pageLen ? Math.max(1, Math.ceil(this.totalCount / this.pageLen)) : 1;
  }
  setPage(n: number): void {
    n = Math.min(Math.max(1, n), this.pageCount);
    if (n === this.pageNo) return;
    this.pageNo = n;
    if (this.remote) void this.load();
    else {
      this.refreshView();
      this.fire('page');
    }
  }
  setPageSize(n: number): void {
    this.pageLen = n;
    this.pageNo = 1;
    this.changeView('page');
  }

  // ---- editing -------------------------------------------------------------------------------

  add(raw: Partial<T> | Partial<T>[]): Model<T>[] {
    const recs = (Array.isArray(raw) ? raw : [raw]).map((r) => this.wrap(r));
    this.all = [...this.all, ...recs];
    this.total += recs.length;
    this.refreshView();
    this.fire('add', recs);
    return recs;
  }

  insert(index: number, raw: Partial<T>): Model<T> {
    const rec = this.wrap(raw);
    this.all = [...this.all.slice(0, index), rec, ...this.all.slice(index)];
    this.total++;
    this.refreshView();
    this.fire('add', [rec]);
    return rec;
  }

  remove(target: Model<T> | number | Array<Model<T>>): void {
    const list = Array.isArray(target) ? target : [typeof target === 'number' ? this.visible[target] : target];
    const gone = list.filter((r) => r && this.all.includes(r));
    if (!gone.length) return;
    this.all = this.all.filter((r) => !gone.includes(r));
    this.removed.push(...gone.filter((r) => !r.phantom));
    this.total -= gone.length;
    this.refreshView();
    this.fire('remove', gone);
  }

  /** Applies live changes in place, with one repaint: known ids are patched (not marked as edits), unknown ones are added, `remove` drops. */
  applyPatches(patches: Array<Patch<T>>): void {
    const idf = this.cfg.model?.idField ?? 'id';
    const byId = new Map(this.all.map((r) => [r.id, r]));
    const added: Model<T>[] = [];
    let touched = false;
    for (const p of patches) {
      const id = p.id ?? p.data?.[idf];
      const rec = id === undefined ? undefined : byId.get(id);
      if (p.op === 'remove') {
        if (!rec) continue;
        byId.delete(id!);
        this.all = this.all.filter((r) => r !== rec);
        this.total--;
        touched = true;
      } else if (rec) touched = rec.patch(p.data!) || touched;
      else if (p.data) {
        const m = this.wrap(p.data);
        added.push(m);
        byId.set(m.id, m);
      }
    }
    if (added.length) {
      this.all = [...this.all, ...added];
      this.total += added.length;
    }
    if (!added.length && !touched) return;
    this.refreshView();
    this.fire('patch', patches);
  }

  /** Applies what a source sends as it arrives (`{ op, data, id }`, or an array of them; text is parsed as JSON). Returns the function that stops it. */
  connect(source: LiveSource, parse: (data: any) => Patch<T> | Array<Patch<T>> = (d) => (typeof d === 'string' ? JSON.parse(d) : d)): () => void {
    const fn = (e: { data: any }) => {
      const p = parse(e.data);
      this.applyPatches(Array.isArray(p) ? p : [p]);
    };
    source.addEventListener('message', fn);
    return () => source.removeEventListener('message', fn);
  }

  clear(): void {
    this.removed.push(...this.all.filter((r) => !r.phantom));
    this.setRecords([], 0);
    this.fire('remove', []);
  }

  recordChanged(rec: Model, field: string): void {
    if (this.sorters.some((s) => s.field === field) || this.filters.length) this.refreshView();
    this.fire('update', rec, field);
  }

  getModified(): Model<T>[] {
    return this.all.filter((r) => r.phantom || r.isDirty());
  }
  getRemoved(): Model<T>[] {
    return this.removed;
  }
  commitChanges(): void {
    this.all.forEach((r) => r.commit());
    this.removed = [];
  }

  /** Writes pending changes through the proxy: deletes, then creates and updates, one at a time. */
  async sync(): Promise<void> {
    const p = this.proxy;
    if (!p) throw new Error('Optikos Store: sync() needs a proxy');
    for (const r of this.removed) await p.destroy?.(r.data);
    this.removed = [];
    for (const r of this.all) {
      if (r.phantom) Object.assign(r.data, (await p.create?.(r.data)) ?? {});
      else if (r.isDirty()) Object.assign(r.data, (await p.update?.(r.data)) ?? {});
      else continue;
      r.commit();
    }
    this.fire('sync');
  }

  /** Observable interface used by `optikos/bind`: calls `fn` on any change; returns the unsubscribe function. */
  subscribe(fn: (change: { type: string }) => void): () => void {
    return this.on('change', fn);
  }
}
