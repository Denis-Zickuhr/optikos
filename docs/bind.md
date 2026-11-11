# Binding and the view model (`optikos/bind`)

Components only know setters (`setText`, `setDisabled`, `setValue`...). `optikos/bind` is an optional layer on top: signals,
`bind(cmp, { text: () => ... })` and, for screens that share state, a **view model** in the spirit of Ext's `ViewModel`.
Nothing in the components imports it.

## Signals

```ts
import { signal, computed, effect, fromStore, bind } from 'optikos/bind';

const n = signal(1);
bind(button, { text: () => `Count: ${n()}`, disabled: () => n() > 9 });
```

## A view model: shared data, formulas, a record

```ts
import { viewModel, bindVM, bindForm } from 'optikos/bind';

const vm = viewModel({
  data: { qty: 2, price: 10 },
  formulas: { total: (get) => get('qty') * get('price'), canSave: (get) => get('total') > 0 },
});

vm.get('total');          // 20; inside an effect/bind it tracks, so the reader reruns when qty or price change
vm.set('qty', 3);         // dotted paths work: vm.set('record.address.city', 'Rio')

grid.on('select', (recs) => vm.link('record', recs[0] ?? null)); // a Model: writes go through model.set (marked modified)
```

`bindVM` is Ext's `bind: { ... }` for any component. A string that is exactly `{path}` is that value (`{!path}` its
negation), anything else is a template:

```ts
bindVM(title, vm, { text: 'Editing {record.name}' });
bindVM(save,  vm, { disabled: '{!canSave}', hidden: '{!record}' });
bindVM(name,  vm, { value: '{record.name}' });          // a field: two ways, its `change` writes back
bindForm(form, vm, 'record');                            // every named field of the form, two ways
```

`bindForm` loads the form when a record is linked and leaves it clean (a form is dirty only after the user edits); edits
write through to the record, and a `Model` is marked modified so `store.getModified()` and `store.sync()` see it.

## What is covered of Ext's ViewModel

| Ext | Optikos |
|---|---|
| `data`, `get('a.b')`, `set('a.b', v)` | `viewModel({ data })`, `vm.get`, `vm.set` |
| `formulas` (with dependencies between them) | `formulas`, read with `get`; lazy and cached |
| `bind: '{record.name}'`, `'{!busy}'`, `'Hi {name}'` | `bindVM(cmp, vm, { prop: '...' })` |
| two-way `value` binding | the same, on fields |
| `links` / `setLinks` to a record | `vm.link(name, model)` |
| bind a form to a record | `bindForm(form, vm, name)` |
| `stores` in the view model | not needed: a `Store` is an object; wrap it with `fromStore(store)` to read it in an effect |
| ViewModel hierarchy (parent/child inheritance) | not covered: use one view model per screen and pass it down |
| `twoWayBindable`, `deep`, `bind` options | not covered |
