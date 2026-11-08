import { format, type Formatter } from './format';
import type { Model } from './model';

export interface Column {
  field: string;
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
  /** Name registered with `registerFormat` (`money`, `date`, `number`, `percent`, `bool`) or a function. */
  format?: string | Formatter;
  /** Full control over the cell content. Text is escaped; return a Node for markup. */
  renderer?: (value: any, rec: Model, col: Column) => string | Node;
  cls?: string;
}

/** Cell content for a record: `renderer` first, then `format`, then the plain value. */
export function cellContent(col: Column, rec: Model): string | Node {
  const v = rec.data[col.field];
  if (col.renderer) return col.renderer(v, rec, col);
  if (col.format) return format(col.format, v);
  return v == null ? '' : String(v);
}
