# Component catalog

Priority: **P0** = needed by the demos; **P1** = completes the library; **P2** = later. ✔ = done.

## Base

| Component | `type` | Priority |
|---|---|---|
| Button | `button` | P0 |
| Icon | `icon` | P0 |
| Label | `label` | P0 |
| SplitButton | `splitbutton` | P1 |
| Link | `link` | P1 |
| Badge | `badge` | P1 |
| Chip | `chip` | P1 |
| Avatar | `avatar` | P2 |

## Layout / containers

| Component | `type` | Priority |
|---|---|---|
| Container | `container` | P0 |
| Panel | `panel` | P0 |
| Viewport | `viewport` | P0 |
| FieldSet | `fieldset` | P0 |
| Toolbar | `toolbar` | P0 |
| Spacer | `spacer` | P0 |
| Card (`card` layout) | — | P0 (layout) |
| Splitter | `splitter` | P1 |
| Accordion | `accordion` | P1 |

Layouts: `fit`, `hbox`, `vbox`, `border`, `grid`, `card` (all P0, in the core).

## Fields

| Component | `type` | Priority |
|---|---|---|
| TextField | `textfield` | P0 |
| TextArea | `textarea` | P0 |
| NumberField | `numberfield` | P0 |
| DateField | `datefield` | P0 |
| Checkbox | `checkbox` | P0 |
| Radio / RadioGroup | `radio`, `radiogroup` | P0 |
| Select | `select` | P0 |
| ComboBox | `combobox` | P0 |
| SuggestField | `suggestfield` | P0 |
| PasswordField | `passwordfield` | P1 |
| TimeField, DateTimeField | `timefield`, `datetimefield` | P1 |
| DateRangeField | `daterangefield` | P1 ✔ |
| CheckboxGroup | `checkboxgroup` | P1 |
| Slider (a track with a knob, single or range) | `slider` | P1 ✔ |
| Toggle | `toggle` | P1 |
| TagField | `tagfield` | P1 |
| MaskField, CurrencyField | `maskfield`, `currencyfield` | P1 |
| FileField | `filefield` | P1 |
| ColorField, Rating, HtmlEditor | — | P2 |

## Forms

| Component | `type` | Priority |
|---|---|---|
| Form | `form` | P0 |
| Validators | (functions) | P0 |
| FieldContainer | `fieldcontainer` | P1 |
| Data binding | `form.load / getValues` | P0 (decision in the spec sheet) |
| Tabbed form (`Form` with `tabs`) | `form` + `tabs` | P1 ✔ |
| StepForm (multi-step form) | `stepform` | P1 ✔ |

## Data

| Component | `type` | Priority |
|---|---|---|
| Grid | `grid` | P0 (sort, select, page, virtualize) |
| Table | `table` | P0 |
| Pagination | `pagination` | P0 |
| Grid P1 | ✔ column management (menu with search), ✔ selection column (checkbox) and bulk actions, ✔ reordering and resizing columns, ✔ inline editing (`cellEditing()` plugin); missing: frozen columns, grouping | P1 |
| FilterBuilder | `filterbuilder` | P1 ✔ |
| SearchGrid | `searchgrid` | P1 ✔ |
| ViewManager (saved views of columns/filters/sorting) | `viewmanager` | P1 ✔ |
| LookupField (a field + a search window with a grid) | `lookupfield` | P1 ✔ |
| DataView (a grid of cards from a Store) | `dataview` | P1 ✔ |
| Tree | `tree` | P1 ✔ |
| TreeGrid, PropertyGrid, pivot | — | P2 |

Non-visual data: Store, Model, Proxy (memory, function, REST) — P0, in `optikos/data`.

## Overlays

| Component | `type` | Priority |
|---|---|---|
| Dropdown (base) | `dropdown` | P0 |
| Window (modal) | `window` | P0 |
| MessageBox (alert, confirm, prompt) | `MessageBox` function | P0 |
| Tooltip | `tooltip` / `tooltip` config | P0 |
| Menu | `menu` | P0 |
| Toast | `toast()` function | P0 |
| CommandPalette (Ctrl/⌘+K) | `commandpalette` | P1 ✔ |
| Widget (a floating panel pinned to an edge) | `widget` | P1 ✔ |
| ContextMenu, Popover, Drawer (modal) | — | P1 |

## Navigation

| Component | `type` | Priority |
|---|---|---|
| Tabs | `tabs` | P0 |
| Breadcrumb | `breadcrumb` | P0 |
| Sidebar/NavMenu | `navmenu` | P1 ✔ |
| Stepper (step indicator; the base of StepForm) | `stepper` | P1 ✔ |
| Simple router | — | P2 |

## Feedback

| Component | `type` | Priority |
|---|---|---|
| LoadMask (+ Spinner) | `loading` config / `spinner` | P0 |
| ProgressBar | `progress` | P1 |
| Alert / Banner | `alert` | P1 |
| Skeleton, EmptyState | — | P2 |

## Chat

| Component | `type` | Priority |
|---|---|---|
| Chat (conversation + composer + streaming) | `chat` | P1 ✔ |

## Dates

| Component | `type` | Priority |
|---|---|---|
| Calendar (date picker) | `calendar` | P0 |
| Calendar `range: true` | `calendar` | P1 ✔ |
| Scheduler | — | P2 |

## Charts (P2)

Decision: **outside the core**. If it comes, it will be a separate bundle, because the size of a chart engine would
break the "Light" pillar.

## Motion

| Piece | What it is |
|---|---|
| `optikos/motion` | animation and micro-interaction engine (20 motion design rules), configurable, with a global switch ✔ (`docs/motion.md`) |

## UI helpers

| Piece | What it is |
|---|---|
| `optikos/ui` | `ui.text(...)`, `ui.select(...)`, `ui.row(...)` shortcuts and enums (`Variant`, `Op`...) ✔ (`docs/ui.md`) |

## Shared pieces (they live in the core)

| Piece | Used by | Where |
|---|---|---|
| `Emitter` | Component, Store, Dropdown | `core/emitter.ts` |
| DOM factory `h()` | everything | `core/dom.ts` |
| Floating layer (`layer`) | Dropdown, Window, Tooltip, Toast, Menu, LoadMask | `core/layer.ts` |
| Positioning of floating elements | Dropdown, Tooltip, Menu (submenus) | `core/position.ts` |
| Focus trap | Window, MessageBox, Drawer (P1) | `core/focus.ts` |
| Roving tabindex / arrow navigation | Tabs, Toolbar, Menu, RadioGroup | `core/focus.ts` |
| `ListBox` (a list with `aria-activedescendant`) | Select, ComboBox, SuggestField (and List, P1) | `components/fields/listbox` |
| Virtualization | Grid, ListBox (long lists), Tree (P1) | `core/virtual.ts` |
| Validators | Field, Form | `core/validators.ts` |
| i18n with locale objects (`addMessages` per component) | validators, every component with text | `core/i18n.ts` |
| Built-in icons | Button, Select, Window, Toast, Tree... | `components/base/icon` |

Rule: a piece only goes into `core/` when at least three real components use it (principle 3).
`ListBox` and `Dropdown` stay components (not utilities) because users can use them too.
