// The Ext-style ViewModel on top of the signals: shared data, formulas, a linked record, and `{path}` bindings for components.
import type { Component } from '../core/component';
import type { Field } from '../core/field';
import type { Model } from '../data/model';
import { getPath, setPath } from '../core/path';
import { signal, computed, effect, bind } from './index';

export interface ViewModelConfig {
  /** The starting data, nested as you like (`{ qty: 2, record: { name: 'Ada' } }`). */
  data?: Record<string, any>;
  /** Values computed from the data and each other: `{ total: (get) => get('qty') * get('price') }`. They are read like data (`get('total')`) and rerun when what they read changes. */
  formulas?: Record<string, (get: <T = any>(path: string) => T) => unknown>;
}

export interface ViewModel {
  /** Reads a dotted path. Inside an `effect`, `computed` or `bind` it makes the reader rerun when that path changes. */
  get<T = any>(path: string): T;
  /** Writes a dotted path and notifies whoever read it, or something under it, or above it. A formula cannot be written. */
  set(path: string, value: unknown): void;
  /** Makes `name` stand for a record (a Model, or a plain object): `link('record', grid.getSelection()[0])`. A write to `record.x` goes through `model.set`, so the record is marked modified. `null` clears it. */
  link(name: string, record: Model | Record<string, any> | null): void;
  /** Counts the `link` calls for `name` (reactive): a form uses it to know it was given a new record. */
  linked(name: string): number;
}

const isModel = (v: unknown): v is Model => !!v && typeof (v as Model).set === 'function' && 'data' in (v as object);

/** Shared state for a screen: the Ext `ViewModel` subset that matters (data, formulas, a linked record) without the rest. */
export function viewModel(config: ViewModelConfig = {}): ViewModel {
  const data: Record<string, any> = structuredClone(config.data ?? {});
  const versions = new Map<string, ReturnType<typeof signal<number>>>();
  const models = new Map<string, Model>();
  const links = new Map<string, ReturnType<typeof signal<number>>>();
  const formulas = new Map<string, () => unknown>();
  const sig = (path: string) => versions.get(path) ?? (versions.set(path, signal(0)), versions.get(path)!);

  const vm: ViewModel = {
    get(path) {
      sig(path)();
      const root = path.split('.')[0];
      if (config.formulas && root in config.formulas) {
        let f = formulas.get(root);
        if (!f) formulas.set(root, (f = computed(() => config.formulas![root](vm.get))));
        return getPath({ [root]: f() }, path);
      }
      return getPath(data, path);
    },
    set(path, value) {
      const [root, ...rest] = path.split('.');
      if (config.formulas && root in config.formulas) throw new Error(`Optikos viewModel: "${root}" is a formula and cannot be set`);
      const model = models.get(root);
      if (model && rest.length === 1) model.set(rest[0], value);
      else setPath(data, path, value);
      for (const [p, s] of versions) if (p === path || p.startsWith(`${path}.`) || path.startsWith(`${p}.`)) s.update((n) => n + 1);
    },
    link(name, record) {
      if (isModel(record)) (models.set(name, record), (data[name] = record.data));
      else (models.delete(name), (data[name] = record));
      (links.get(name) ?? (links.set(name, signal(0)), links.get(name)!)).update((n) => n + 1);
      for (const [p, s] of versions) if (p === name || p.startsWith(`${name}.`)) s.update((n) => n + 1);
    },
    linked: (name) => (links.get(name) ?? (links.set(name, signal(0)), links.get(name)!))(),
  };
  return vm;
}

/**
 * What a binding string means: `'{record.name}'` is that value as it is (`'{!busy}'` its negation), anything else is a
 * template (`'Hello {record.name}'`).
 */
function source(vm: ViewModel, spec: string): () => unknown {
  const whole = /^\{(!?)([\w.]+)\}$/.exec(spec);
  if (whole) return () => (whole[1] ? !vm.get(whole[2]) : vm.get(whole[2]));
  return () => spec.replace(/\{([\w.]+)\}/g, (_, p) => String(vm.get(p) ?? ''));
}

/**
 * Ext's `bind: { text: '{record.name}', disabled: '{!canSave}' }` for any component: each key calls its setter whenever
 * what the string reads changes. A field's `value: '{record.name}'` is two ways: the field's `change` writes back.
 */
export function bindVM(cmp: Component<any>, vm: ViewModel, map: Record<string, string>): void {
  const sources: Record<string, () => unknown> = {};
  for (const key in map) sources[key] = source(vm, map[key]);
  bind(cmp, sources);
  const two = /^\{([\w.]+)\}$/.exec(map.value ?? '');
  if (two) cmp.own(cmp.on('change', (v) => vm.set(two[1], v)));
}

/**
 * Binds every named field of a form to `record.<name>` of the view model, both ways. When the record is replaced (`link`)
 * the form is loaded from it and becomes clean; a change in the form writes through to the record (a Model is marked modified).
 */
export function bindForm(form: Component<any> & { getFields(): Array<Field<any>> }, vm: ViewModel, name = 'record'): void {
  for (const f of form.getFields()) {
    if (!f.name) continue;
    let seen = -1;
    const path = `${name}.${f.name}`;
    form.own(
      effect(() => {
        const gen = vm.linked(name);
        const v = vm.get(path);
        f.setValue(v === undefined ? f.getValue() : v, true);
        if (gen !== seen) (f.markClean(), (seen = gen));
      }),
    );
    form.own(f.on('change', (v) => vm.get(name) && vm.set(path, v)));
  }
}
