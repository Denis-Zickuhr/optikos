# Stat  (type: 'stat')
Purpose:       A KPI tile: a label, a big value, the change since last time (good or bad by the direction you say is good) and an optional sparkline.
Anatomy:       `op-stat` > `op-stat__label` (+ icon), `op-stat__row` (`op-stat__value`, `op-stat__delta` with `is-good`/`is-bad`/`is-flat`), `op-stat__caption`, and a sparkline `Chart` (`op-stat__spark`).
Config:        `label`, `value` (number or text; `null` shows —), `format` (registered format or function, for a number), `delta` (a fraction: `0.125` shows `+12.5%`), `good: 'up'|'down'` (up; `down` for costs, errors, waiting times), `caption`, `icon`, `trend: number[]` (sparkline). `href` makes the tile a link; `handler(stat, ev)` makes it a button (`role=button`, focusable, hover and focus ring) for drill-down.
API:           `setLabel`, `setValue`, `setDelta`, `setCaption`, `setTrend`.
Events:        —
States:        No `delta`: the change is hidden. `delta` 0: neutral (`is-flat`).
Keyboard/ARIA: Plain tile: not interactive. With `href` or `handler` it is one tab stop, Enter and Space run the handler, and it is named "label: value" (or `ariaLabel`). The change is read as text ("up 12.5%"), not as an arrow; the sparkline is named by the label.
Tokens:        `--op-stat-bg`, `--op-stat-radius`, `--op-stat-value-size`, `--op-stat-spark-width`, plus the semantic success/danger colors for the change.
Sandbox cases: `data`: with and without trend, a cost (`good: 'down'`), money format, updated through `setValue`.
Out of scope:  A time-range picker, comparison periods computed for you.
