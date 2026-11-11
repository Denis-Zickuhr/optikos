# Back-office recipes

What a CRUD panel, an ERP screen or a dashboard needs, with the Optikos piece for each. Every snippet is runnable; the
same cases are in the live examples of the docs site (components `form`, `numberfield`, `chart`, `stat`, `timeline`...).

## Permissions

One resolver for the app, one `permission` on anything that should depend on it.

```ts
import { setPermissionResolver, setPermissionMode } from 'optikos';

setPermissionResolver((p) => user.permissions.includes(p));
setPermissionMode('hide'); // or 'disable'; a component's own `permissionMode` wins

create({ type: 'button', text: 'New lot', permission: 'sale.lot.create' });
create({ type: 'grid', columns, rowActions: [{ text: 'Delete', permission: 'sale.lot.delete', handler }] });
create({ type: 'navmenu', items: [{ id: 'lots', text: 'Lots', permission: 'sale.lot.view' }] });
```

`permission` works on every component (hidden, or disabled), and on menu items, `NavMenu` items, command palette
commands, grid columns, row actions and bulk actions. A hidden component cannot be shown again with `show()`. The
resolver is read when the component renders: set it before building the screen.

## Lookups that show their text

The record arrives with an id and the name: tell the field where the name is, and nothing searches.

```ts
{ type: 'lookupfield', name: 'event', displayFrom: 'eventName', lookup: 'events' }
form.load({ event: 7, eventName: 'Gala' }); // shows "Gala"; getValues().event is 7
```

It works inside `FieldList` rows, also in a step that is not open yet. `field.setValue({ value: 7, label: 'Gala' })` does it by hand.

## Server errors on the fields

```ts
try { await api.save(form.getValues()); }
catch (e) {
  const left = form.setErrors(e.fieldErrors); // { slug: 'In use', 'criteria.0.name': 'Taken' }
  if (left.length) toast({ type: 'error', text: left.map((p) => e.fieldErrors[p]).join(' ') });
}
```

Dotted paths reach a row of a `FieldList` (`list.index.field`). The first error opens its tab or `StepForm` step and takes the focus.

## Values in the shape the API wants

```ts
{ type: 'numberfield', name: 'price', format: 'currency', scale: 100 } // the value is cents: 123456 shows 1.234,56
{ type: 'numberfield', name: 'tax', format: 'percent' }                // the value is a fraction: 0.15 shows 15%
{ type: 'datetimefield', name: 'startsAt', utc: true }                 // the value is an ISO instant
```

`setLocale('pt-BR')` and `setCurrency('BRL')` set the defaults for the whole app; `locale` and `currency` set one field.

## Masks, and rules that are yours

```ts
ui.mask('taxId', 'Tax id', ['000.000.000-00', '00.000.000/0000-00'], { raw: true, validators: [checkDigits] })
```

The mask knows `0` (digit), `A` (letter), `*` (anything) and `\` (a literal). Country formats and check digits belong to
the app: a mask never guesses a country, and `validators` takes any function.

## Closing a dirty form

```ts
create({ type: 'window', title: 'Edit lot', confirmDiscard: true, items: [form] });
```

## Live data

```ts
const store = new Store({ proxy, remote: true, autoLoad: true });
const stop = store.connect(new EventSource('/events/votes')); // messages: { op?: 'upsert'|'remove', data?, id? } or an array
store.applyPatches([{ data: { id: 3, votes: 120 } }, { op: 'remove', id: 9 }]); // by hand, one repaint
```

A known id is patched in place (and is **not** a local edit: nothing becomes dirty; a field the user is editing keeps
their value), an unknown one is added. Grids, charts, timelines and `bind` repaint once per message, however many records it carries.

## Dashboards

```ts
{ type: 'stat', label: 'Votes', value: 12840, delta: 0.125, trend: [4, 6, 5, 9, 12] }
{ type: 'chart', kind: 'area', x: 'hour', series: ['votes'], store: votesStore, title: 'Votes per hour' }
{ type: 'chart', kind: 'donut', x: 'candidate', series: ['votes'], store: totalsStore }
```

Series colors are the theme's `--op-chart-1…8`, so dark mode and a tenant's theme recolor every chart. The data is also in
a hidden table for screen readers, and ←/→ walk the points.

## Export and print

```ts
await exportGrid(grid, { format: 'xlsx', filename: 'lots' }); // visible columns, current sort and filters, every page
await printGrid(grid, { title: 'Lots' });                      // a plain table: header on every page, none of the app around it
```

## Remember the user's layout

```ts
create({ type: 'grid', columns, resizableColumns: true, plugins: [persistState('grid-lots')] });
setStateStorage({ get: (k) => api.getPref(k), set: (k, v) => api.setPref(k, v) }); // optional: follow the user across devices
```

## Shortcuts

```ts
shortcuts.register({ keys: 'mod+s', title: 'Save', handler: () => form.submit() });
shortcuts.register({ keys: 'alt+n', title: 'New lot', scope: 'lots', handler: openNew });
shortcuts.setScope('lots'); // when the lots screen is shown; `?` opens the list
```

## Theme from two colors

```ts
import { defineTheme, loadFonts } from 'optikos';

const brand = defineTheme({
  seeds: { primary: '#D9A441', neutral: '#2A1C12' },       // light + dark, text pairs kept at 4.5:1
  font: { family: "'Brand Sans', system-ui, sans-serif" },
  fonts: [{ family: 'Brand Sans', url: '/fonts/brand.woff2', weight: '400 700' }],
}, 'brand');
brand.apply();           // data-op-theme="brand"; add "dark" for the night look: data-op-theme="brand dark"
await loadFonts(brand.fonts);
```

On localhost `apply()` also prints every text pair under 4.5:1 (`checkContrast()` does it on demand).

## Developing and testing

```ts
import 'optikos/dev'; // warns about options a component ignores: "button" has no option "tooltips" (did you mean "tooltip"?)
```

```ts
import { fill, submit, errors, clickRow, loaded, pickLookup } from 'optikos/testing';

const values = await submit(form, { name: 'Ada', 'address.city': 'London' }); // null when invalid
expect(errors(form)).toEqual({});
await loaded(store);
clickRow(grid, (r) => r.get('name') === 'Ada');
await pickLookup(eventLookup, 0);
```
