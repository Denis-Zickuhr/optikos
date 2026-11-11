import { format, type Formatter } from './format';
import type { Model } from './model';

/** A grid/table column. `T` is the record shape: `field` then autocompletes its keys (any string still works). */
export interface Column<T extends Record<string, any> = any> {
  field: Extract<keyof T, string> | (string & {});
  header?: string;
  /** Fixed width in px. */
  width?: number;
  /** Share of the free space (like CSS `fr`). Default 1 when there is no `width`. */
  flex?: number;
  /** A label that groups columns ("Identification", "Values"...): a band over the header and sections in the column menu. */
  group?: string;
  minWidth?: number;
  /** Upper bound when the user resizes it. */
  maxWidth?: number;
  /** `false` keeps a column's width fixed even when the grid has `resizableColumns`. */
  resizable?: boolean;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  hidden?: boolean;
  /** Pinned to the start or the end while the body scrolls sideways (give it a `width`; default 140). The columns of one edge stay together. */
  locked?: 'start' | 'end';
  /** With `grouping()` or `columnTotals()`: what the total shows. Numbers: `sum`, `avg`, `min`, `max`, `count`; dates: `min` (earliest), `max` (latest), `count`; or your own function of the values. */
  summary?: 'sum' | 'avg' | 'min' | 'max' | 'count' | ((values: any[], recs: Model<T>[]) => unknown);
  /** Text for the total of this column (default: the column's `format`, else the plain value). */
  summaryRenderer?: (value: any, col: Column<T>) => string | Node;
  /** Left out while `setPermissionResolver` denies it. */
  permission?: string;
  /** Name registered with `registerFormat` (`money`, `date`, `number`, `percent`, `bool`, `duration`: minutes as `7h 30m`) or a function. */
  format?: string | Formatter;
  /** Full control over the cell content. Text is escaped; return a Node for markup. */
  renderer?: (value: any, rec: Model<T>, col: Column<T>) => string | Node;
  cls?: string;
  /** With the `cellEditing()` grid plugin: `true` (an editor for the value's type), a field type (`'select'`) or a field config. */
  editor?: boolean | string | Record<string, any>;
  /** With `cellEditing()`: whether this record's cell can be edited (default: every record, when `editor` is set). */
  editable?: (rec: Model<T>) => boolean;
}

/** Cell content for a record: `renderer` first, then `format`, then the plain value. */
export function cellContent<T extends Record<string, any>>(col: Column<T>, rec: Model<T>): string | Node {
  const v = rec.data[col.field];
  if (col.renderer) return col.renderer(v, rec, col);
  if (col.format) return format(col.format, v);
  return v == null ? '' : String(v);
}

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v));
const time = (v: unknown) => (v instanceof Date ? +v : typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? Date.parse(v) : NaN);

/** The value of a column's `summary` over some records. */
export function summarize(col: Column, recs: Model[]): unknown {
  const values = recs.map((r) => r.data[col.field]);
  const nums = values.filter((v) => v != null && v !== '' && !isNaN(num(v))).map(num);
  const s = col.summary;
  if (typeof s === 'function') return s(values, recs);
  if (s === 'count') return values.filter((v) => v != null && v !== '').length;
  if (!nums.length) {
    // dates have no sum: min/max give the earliest and the latest, as the value the record holds
    const dates = s === 'min' || s === 'max' ? values.filter((v) => !isNaN(time(v))) : [];
    return dates.length ? dates.reduce((a, b) => ((s === 'min' ? time(b) < time(a) : time(b) > time(a)) ? b : a)) : null;
  }
  if (s === 'sum') return nums.reduce((a, b) => a + b, 0);
  if (s === 'avg') return nums.reduce((a, b) => a + b, 0) / nums.length;
  return s === 'min' ? Math.min(...nums) : Math.max(...nums);
}
