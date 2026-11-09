# Calendar  (type: 'calendar')
Purpose:       Calendar to pick a day (date picker); used by DateField.
Anatomy:       `.op-calendar` > `__header` (prev, title, next), `__grid[role=grid]` (days) or a grid of months; `__day`, `is-today`, `is-selected`, `is-outside`.
Config:        `value` (ISO; with `range: true`, `{ start, end }`), `range: false` (two clicks: start and end; a second click before the start swaps them; `end` is `null` until the 2nd click), `min`, `max`, `firstDay` (from the locale), `isDisabled(iso) => boolean`.
API:           `setValue`, `setRange(bool)`, `setMin`, `setMax`, `showMonth(year, month)`, `focusDay()`.
Events:        `select(iso)` (range: `select({start, end})` only on the 2nd click; `start(iso)` on the 1st), `navigate(year, month)`.
Keyboard/ARIA: Grid with `role=grid`, days are `role=gridcell` + `aria-selected`, `aria-label` with the full date. ←→ ±1 day, ↑↓ ±1 week, Home/End of the week,
               PageUp/PageDown ±1 month, Shift+Page ±1 year, Enter/Space picks. The title switches day ↔ month view.
Tokens:        `--op-calendar-bg/day-size/day-hover-bg/day-selected-bg/day-selected-fg/today-border/outside-fg/range-bg/range-fg`. Range classes: `is-in-range`, `is-range-start`, `is-range-end`.
Sandbox cases: current month, value, min/max, disabled days, pt-BR (the week starts on Sunday; en follows the locale), keyboard focus, range (`range: true`, with `min`/`max`).
Out of scope:  previewing the range on hover, range shortcuts ("last 7 days"), several months at once, Scheduler (P2).
