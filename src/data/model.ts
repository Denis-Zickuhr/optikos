export interface FieldDef {
  type?: 'string' | 'number' | 'boolean';
  default?: unknown;
}
export interface ModelDef {
  idField?: string;
  fields?: Record<string, FieldDef>;
}

export interface RecordOwner {
  recordChanged(rec: Model, field: string): void;
}

let cid = 0;

function convert(v: unknown, def?: FieldDef): unknown {
  if (v == null || !def?.type) return v;
  if (def.type === 'number') return v === '' ? null : Number(v);
  if (def.type === 'boolean') return v === 'false' ? false : Boolean(v);
  return String(v);
}

/** One record. `data` holds the values; `set` tracks the original value of each changed field. */
export class Model<T extends Record<string, any> = Record<string, any>> {
  data: T;
  phantom: boolean;
  owner?: RecordOwner;
  private readonly clientId = `c${++cid}`;
  private original: Partial<T> = {};

  constructor(raw: Partial<T> = {}, private def: ModelDef = {}) {
    const data: Record<string, unknown> = { ...raw };
    for (const f in def.fields) {
      const fd = def.fields[f];
      data[f] = convert(data[f] === undefined ? fd.default : data[f], fd);
    }
    this.data = data as T;
    this.phantom = this.data[def.idField ?? 'id'] === undefined;
  }

  get id(): string | number {
    return this.data[this.def.idField ?? 'id'] ?? this.clientId;
  }

  get<K extends keyof T>(field: K): T[K] {
    return this.data[field];
  }

  set<K extends keyof T>(field: K, value: T[K]): void {
    const v = convert(value, this.def.fields?.[field as string]) as T[K];
    if (this.data[field] === v) return;
    if (!(field in this.original)) this.original[field] = this.data[field];
    this.data[field] = v;
    this.owner?.recordChanged(this as Model, field as string);
  }

  /** Applies values that came from the server. It is not an edit (nothing becomes dirty), and a field the user already changed keeps their value. */
  patch(raw: Partial<T>): boolean {
    let changed = false;
    for (const k in raw) {
      const v = convert(raw[k], this.def.fields?.[k]) as T[typeof k];
      if (k in this.original || this.data[k] === v) continue;
      this.data[k] = v;
      changed = true;
    }
    return changed;
  }

  isDirty(): boolean {
    return Object.keys(this.original).length > 0;
  }
  getChanges(): Partial<T> {
    const out: Partial<T> = {};
    for (const k in this.original) out[k] = this.data[k];
    return out;
  }
  commit(): void {
    this.original = {};
    this.phantom = false;
  }
  reject(): void {
    Object.assign(this.data, this.original);
    this.original = {};
  }
}
