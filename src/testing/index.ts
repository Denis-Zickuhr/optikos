// Helpers for testing an app built with Optikos (Vitest + happy-dom, or any DOM): fill a form, pick a row, wait for a store.
// They go through the public API and real DOM events, so a test reads like what the user does.
import type { Form } from '../components/form/form/form';
import type { Grid } from '../components/data/grid/grid';
import type { Field } from '../core/field';
import type { Component } from '../core/component';
import type { Store } from '../data/store';
import type { Model } from '../data/model';
import type { LookupField } from '../components/fields/lookupfield/lookupfield';
import { setPath } from '../core/path';

/** Lets pending promises, microtasks and 0 ms timers run (after `fill`, `store.load()`, a debounce of `ms`...). */
export const flush = (ms = 0): Promise<void> => new Promise((done) => setTimeout(done, ms));

/** Types into a field the way a user does: sets the input and fires `input`, so parsing, masks and validation run. Falls back to `setValue`. */
export function type(field: Field<any> | HTMLInputElement, text: string): void {
  const input = field instanceof HTMLElement ? field : (field.el.querySelector('input,textarea') as HTMLInputElement | null);
  if (!input) return void (field as Field<any>).setValue(text);
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Fills a form from an object (`{ 'address.city': 'Rio', name: 'Ada' }` or nested). Text fields are typed into; the rest get `setValue`. */
export function fill(form: Form, values: Record<string, any>): Form {
  const flat: Record<string, any> = {};
  const walk = (o: Record<string, any>, prefix = '') => {
    for (const k in o) {
      const path = prefix + k;
      if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && !form.getField(path)) walk(o[k], `${path}.`);
      else flat[path] = o[k];
    }
  };
  walk(values);
  for (const name in flat) {
    const f = form.getField(name);
    if (!f) throw new Error(`Optikos testing: the form has no field "${name}"`);
    if (typeof flat[name] === 'string' && f.el.querySelector('input[type=text],input:not([type]),textarea') && !f.el.querySelector('[role=combobox]')) type(f, flat[name]);
    else f.setValue(flat[name]);
  }
  return form;
}

/** Fills and submits. Resolves with the values when the form was valid and submitted, or `null`. */
export async function submit(form: Form, values?: Record<string, any>): Promise<Record<string, any> | null> {
  if (values) fill(form, values);
  let sent: Record<string, any> | null = null;
  const off = form.on('submit', (v: Record<string, any>) => (sent = v));
  form.submit();
  await flush();
  off();
  return sent;
}

/** What the form shows as errors: `{ fieldName: message }`. */
export function errors(form: Form): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of form.getFields()) if (f.name && f.getError()) setPath(out, f.name, f.getError());
  return out;
}

/** Selects a grid row by index, or by the first record the predicate accepts; returns its record. */
export function clickRow<T extends Record<string, any>>(grid: Grid<T>, which: number | ((rec: Model<T>) => boolean)): Model<T> {
  const store = grid.getStore();
  const rec = typeof which === 'number' ? store.getAt(which) : store.getRange().find(which);
  if (!rec) throw new Error('Optikos testing: no such row in the grid');
  grid.select(rec);
  grid.emit('row-click', rec);
  return rec;
}

/** Waits until the store is not loading (and, if it has not started yet, until its first `load`). */
export async function loaded<T extends Record<string, any>>(store: Store<T>): Promise<Store<T>> {
  if (store.loading) await new Promise((done) => store.once('load', done));
  await flush();
  return store;
}

/** Opens a lookup's search window, selects the record at `row` and confirms. Resolves with what the field then holds. */
export async function pickLookup(field: LookupField<any>, row = 0): Promise<unknown> {
  field.openDialog();
  await flush();
  const win = (field as unknown as { win?: Component & { query(f: (c: Component) => boolean): Component[] } }).win;
  const sg = win?.query((c) => (c.constructor as { type?: string }).type === 'searchgrid')[0] as unknown as { store: Store<any>; grid: Grid } | undefined;
  if (!sg) throw new Error('Optikos testing: the lookup window did not open');
  await loaded(sg.store);
  sg.grid.select(row);
  [...win!.el.querySelectorAll<HTMLButtonElement>('.op-panel__footer button')].pop()!.click();
  await flush();
  return field.getValue();
}

/** The text a component shows, collapsed to single spaces. */
export const text = (c: Component | HTMLElement): string => ((c instanceof HTMLElement ? c : c.el).textContent ?? '').replace(/\s+/g, ' ').trim();
