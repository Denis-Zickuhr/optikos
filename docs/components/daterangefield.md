# DateRangeField  (type: 'daterangefield')
Purpose:       Picks a period (start and end) in a single field: reports, filters, bookings.
Anatomy:       like `DateField` (`op-datefield`) + `op-daterange`: an input with `11/01/2026 – 11/15/2026`, a calendar button, a Dropdown with a `Calendar` in range mode.
Config:        (TextField) + `value: { start, end } | null` (ISO), `min`, `max`, `firstDay`.
               Accepted text: `start – end`, `start - end`, `start to end`, `start a end` (one day counts as a one-day period; an end before the start is swapped).
API:           (Field) + `open/close/toggle`, `setMin`, `setMax`. `clear()` empties it.
Events:        (Field) `change({start, end})`, `expand`, `collapse`.
States:        `is-open`; invalid: `Enter a valid date` (text), `dateMin` / `dateMax` (the whole period must fit).
Keyboard/ARIA: ↓ opens the calendar (focus on the day), two Enters/clicks pick the start and the end (the 2nd closes and gives the focus back); Esc closes. Date picker combobox: `role=combobox`, `aria-haspopup=dialog`, `aria-expanded`.
Tokens:        those of `DateField` and `Calendar` (`--op-calendar-range-bg/fg`).
Sandbox cases: empty, with a value, min/max, required, read-only, a standalone range `Calendar`.
Out of scope:  period shortcuts ("this month"), two calendars side by side, ranges with time.
Decision:      the ends are called `start`/`end` (the first idea, in docs/internal/fixes.md, was `from`/`to`): they match `Calendar` and the filter's `between` (`[start, end]`).
