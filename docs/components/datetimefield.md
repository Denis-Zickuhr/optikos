# DateTimeField  (type: 'datetimefield')
Purpose:       A date and a time of day side by side, in one value (event start, deadline, appointment).
Anatomy:       `op-field op-datetimefield` > `op-datetimefield__parts` (role group) holding a `DateField` and a `TimeField` (their own labels are hidden; each is named "Date" and "Time").
Value:         `'YYYY-MM-DDTHH:mm'` (local) or `null`. With `utc: true` the value is the ISO instant (`'2026-11-10T17:30:00.000Z'`) of what the user typed in their time zone, and it is shown back in local time. One part without the other is not a value yet: `null`, and an error on validation.
Config:        (Field) + `min`, `max` (dates, `YYYY-MM-DD`), `step` (minutes moved by ↑/↓ in the time part), `utc`.
API:           (Field) + `setMin`, `setMax`.
Events:        `change(value, old)` once both parts are filled or when one is cleared.
States:        The Field states; disabled and readonly reach both parts.
Keyboard/ARIA: As `DateField` (↓ opens the calendar) and `TimeField` (↑/↓ step).
Tokens:        `--op-datetimefield-gap`, plus those of `DateField` and `TimeField`.
Sandbox cases: `fields`: local, `utc`, with `min`/`max`.
Out of scope:  Time zone choice, seconds, a range of date-times.
