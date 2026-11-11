# Timeline  (type: 'timeline')
Purpose:       Events as a vertical list, or a schedule (event phases, staff shifts, rooms) as bars on a time axis, one row per lane.
Anatomy:       `op-timeline--list`: `op-timeline__item` (`is-success|warning|danger|info`) > `__when`, `__marker`, `__body` (`__title`, `__text`). `op-timeline--range`: `__axis` (ticks), one `__lane` per lane (`__lane-name`, `__track` with `__bar`s) and a `__now` marker.
Value:         Items: `{ id?, title, text?, icon?, tone?, time? }` for the list; `{ title, start, end?, lane?, tone?, text?, icon? }` for the schedule. Dates are ISO (`2026-11-10`, or with a time). A date-only `end` includes that whole day.
Config:        `mode: 'list'|'range'` (list), `items` or `store` (records are items), `lanes` (the order of the rows; others follow), `from`/`to` (the window; default the first start to the last end), `now: true` (a marker at the current time).
API:           `setItems(items)`.
Events:        `select(item)` on click or Enter.
States:        Empty. A store feeds it and repaints on any change.
Keyboard/ARIA: `role=list`, items and bars are `listitem`s that take focus; a bar's label says its title and its span ("Show, Nov 12 to Nov 12"). Enter selects.
Tokens:        `--op-timeline-marker`, `--op-timeline-when-width`, `--op-timeline-lane-width`, `--op-timeline-bar-height`, `--op-timeline-line`.
Sandbox cases: `data`: the event log, a schedule with lanes, and a schedule over months.
Out of scope:  Dragging or resizing bars, dependencies between bars, zoom levels, recurring events (a calendar view).
