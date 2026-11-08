export interface Sorter {
  field: string;
  dir: 'asc' | 'desc';
}
export type FilterOp =
  | 'eq' | 'ne' | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | 'gt' | 'ge' | 'lt' | 'le' | 'between' | 'notBetween' | 'in' | 'nin' | 'empty' | 'notEmpty';
export interface FilterSpec {
  field: string;
  op?: FilterOp;
  /** `between`/`notBetween`: `[from, to]`; `in`/`nin`: an array; `empty`/`notEmpty`: ignored. */
  value?: unknown;
}
/** A group of filters joined by AND or OR; groups nest. */
export interface FilterGroup {
  op: 'and' | 'or';
  filters: FilterNode[];
}
export type FilterNode = FilterSpec | FilterGroup;
export interface ReadParams {
  page?: number;
  pageSize?: number;
  sorters?: Sorter[];
  filters?: FilterNode[];
  [extra: string]: unknown;
}
export interface ReadResult<T = any> {
  data: T[];
  total?: number;
}

/** Where a Store gets (and writes) its data. Memory, function and REST implementations share this shape. */
export interface Proxy<T = any> {
  read(params: ReadParams, signal?: AbortSignal): Promise<ReadResult<T> | T[]> | ReadResult<T> | T[];
  create?(data: T): Promise<Partial<T> | void>;
  update?(data: T): Promise<Partial<T> | void>;
  destroy?(data: T): Promise<void>;
}

export class MemoryProxy<T = any> implements Proxy<T> {
  constructor(public rows: T[] = []) {}
  read(): ReadResult<T> {
    return { data: [...this.rows], total: this.rows.length };
  }
}

export interface RestProxyConfig {
  url: string;
  idField?: string;
  headers?: Record<string, string>;
  /** Dotted path of the rows in the JSON when it is an object (`'items'`, `'data.rows'`). */
  root?: string;
  /** Dotted path of the total count in the JSON. Falls back to the `X-Total-Count` header, then to the row count. */
  totalKey?: string;
  fetch?: typeof fetch;
}

const path = (o: any, p: string) => p.split('.').reduce((v, k) => v?.[k], o);

/** REST over `fetch`: `GET url?page&pageSize&sort=a:asc,b:desc&field=value`, `POST url`, `PUT url/:id`, `DELETE url/:id`. */
export class RestProxy<T extends Record<string, any> = any> implements Proxy<T> {
  constructor(private cfg: RestProxyConfig) {}

  private async call(url: string, init: RequestInit): Promise<Response> {
    const res = await (this.cfg.fetch ?? fetch)(url, { ...init, headers: { 'Content-Type': 'application/json', ...this.cfg.headers } });
    if (!res.ok) throw new Error(`Optikos RestProxy: ${init.method ?? 'GET'} ${url} → ${res.status}`);
    return res;
  }

  private itemUrl(d: T) {
    return `${this.cfg.url.replace(/\/$/, '')}/${encodeURIComponent(d[this.cfg.idField ?? 'id'])}`;
  }

  async read(params: ReadParams, signal?: AbortSignal): Promise<ReadResult<T>> {
    const { page, pageSize, sorters, filters, ...extra } = params;
    const q = new URLSearchParams();
    if (page) q.set('page', String(page));
    if (pageSize) q.set('pageSize', String(pageSize));
    if (sorters?.length) q.set('sort', sorters.map((s) => `${s.field}:${s.dir}`).join(','));
    for (const f of filters ?? []) {
      // simple specs map to `field__op=value`; groups and list/range values travel as JSON in `filter`
      if ('filters' in f || Array.isArray(f.value)) q.append('filter', JSON.stringify(f));
      else q.set(!f.op || f.op === 'eq' ? f.field : `${f.field}__${f.op}`, String(f.value ?? ''));
    }
    for (const k in extra) if (extra[k] != null) q.set(k, String(extra[k]));
    const qs = q.toString();
    const res = await this.call(this.cfg.url + (qs ? (this.cfg.url.includes('?') ? '&' : '?') + qs : ''), { signal });
    const json = await res.json();
    const data: T[] = this.cfg.root ? path(json, this.cfg.root) : Array.isArray(json) ? json : (json.data ?? []);
    const header = Number(res.headers.get('X-Total-Count'));
    const total = this.cfg.totalKey ? Number(path(json, this.cfg.totalKey)) : header || data.length;
    return { data, total };
  }

  async create(d: T) {
    return (await (await this.call(this.cfg.url, { method: 'POST', body: JSON.stringify(d) })).json()) as Partial<T>;
  }
  async update(d: T) {
    return (await (await this.call(this.itemUrl(d), { method: 'PUT', body: JSON.stringify(d) })).json().catch(() => undefined)) as Partial<T> | undefined;
  }
  async destroy(d: T) {
    await this.call(this.itemUrl(d), { method: 'DELETE' });
  }
}
