// The docs examples are plain JSON so the MCP server can serve them too. Two markers cover what JSON cannot say:
//   { "$store": [rows] }   → new Store({ data: rows })
//   { "$tpl": "{name}" }   → (record) => text with {field} replaced
//   { "$plugin": "cellEditing", ...options } → the grid plugin
import { Store, cellEditing } from 'optikos';

const PLUGINS: Record<string, (o: object) => unknown> = { cellEditing };

export function hydrate<T>(value: T): T {
  if (Array.isArray(value)) return value.map(hydrate) as T;
  if (!value || typeof value !== 'object') return value;
  const o = value as Record<string, unknown>;
  if ('$store' in o) return new Store({ data: o.$store as never }) as T;
  if ('$plugin' in o) {
    const { $plugin, ...opts } = o;
    return PLUGINS[String($plugin)](opts) as T;
  }
  if ('$tpl' in o) return ((rec: { get(k: string): unknown }) => String(o.$tpl).replace(/\{(\w+)\}/g, (_, k) => String(rec.get(k) ?? ''))) as T;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, hydrate(v)])) as T;
}
