# TimeField  (type: 'timefield')
Purpose:       A time of day in 24 h, typed or stepped with the keyboard (opening hours, appointment time, shift start).
Anatomy:       Like `TextField` (`op-textfield`) + `op-timefield`: one input with `inputmode="numeric"`.
Value:         `'HH:mm'` (e.g. `'09:30'`) or `null`. Typing `930`, `9:30` or `09:30` all give `'09:30'`; the text is normalized when the field loses focus. Text that is not a time is an error (`Enter a time like 09:30`), not a silent drop.
Config:        (TextField) + `min`, `max` (`'HH:mm'`), `step: 1` (minutes moved by ↑/↓).
API:           `getValue()`, `setValue('HH:mm' | null)`, `setMin()`, `setMax()`, plus the TextField/Field API.
Events:        `change`, `enter`.
States:        the Field states (`is-invalid`, `is-readonly`, `is-disabled`).
Keyboard/ARIA: ↑/↓ move by `step` minutes, PageUp/PageDown by an hour. With `min`/`max` the value stops at the limits; without them it wraps around midnight.
Tokens:        those of `TextField`.
Sandbox cases: `fields`: free, with limits and step.
Out of scope:  seconds, 12 h / AM-PM display, a clock dropdown, time zones.
