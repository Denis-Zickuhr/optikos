# Short writing: classes, `ui` shortcuts and enums

Three ways to write the same screen, from the most verbose to the shortest. They all build the same components and mix freely.

```ts
// 1. declarative (JSON-friendly: works for configs that come from a server)
{ type: 'textfield', name: 'email', label: 'Email', inputType: 'email', required: true }

// 2. classes (typed; the editor completes each component's config)
new TextField({ name: 'email', label: 'Email', inputType: 'email', required: true })

// 3. `ui` shortcuts (name, label and, when needed, a config at the end)
ui.email('email', 'Email', { required: true })
```

## `ui` (`import { ui } from 'optikos'` or `'optikos/ui'`)

They return real instances, so they work in any `items: [...]`, mixed with declarative configs. The last argument is always a config that overrides or adds.

| Shortcut | Builds |
|---|---|
| `ui.text/email/password/area/number/date/dateRange/secret/slider/dial(name, label?, cfg?)` | the field of the same name (`email`/`password` set the `inputType`) |
| `ui.check(name, boxLabel?, cfg?)` · `ui.toggle(name, boxLabel?, cfg?)` | `Checkbox`, `Toggle` |
| `ui.radio(name, label, options, cfg?)` · `ui.checkGroup` · `ui.select` · `ui.combo` | option fields |
| `ui.suggest(name, label, query, cfg?)` · `ui.lookup(name, label, lookup, cfg?)` | search as you type / search window |
| `ui.button/primary/danger(text, handler?, cfg?)` | `Button` (the `handler` is the 2nd argument) |
| `ui.row(...items)` · `ui.col(...items)` · `ui.grid(columns, ...items)` | `hbox`, `vbox` and `grid` containers (a numeric `columns` collapses to one column on narrow containers) |
| `ui.panel(title, items, cfg?)` · `ui.toolbar(...items)` · `ui.form(items, cfg?)` | `Panel`, `Toolbar` (takes `'->'`, `'-'`), `Form` |

## Enums

Constant objects with a type of the same name. The value is the string itself, so `Variant.Primary` and `'primary'` are interchangeable; the editor completes both.

`Variant`, `LabelPos`, `Direction`, `Region`, `Side`, `LayoutKind`, `Selection`, `ToastType`, `Op` (filter operators), `ThemeName`.

```ts
ui.radio('kind', 'Type', ['person', 'company'], { direction: Direction.Horizontal })
create({ type: 'button', text: 'Delete', variant: Variant.Danger })
store.filter({ field: 'name', op: Op.Contains, value: 'ada' })
```

## Rules

- `ui` and the enums live in `src/ui/` and have their own entry (`optikos/ui`); they do **not** count against the core budget.
- A shortcut only exists when the pattern is very common (fields, buttons, containers); the rest stays a class or `create`.
- A new component with a repeated usage pattern gets its shortcut here in the same commit as its spec sheet.
