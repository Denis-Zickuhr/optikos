# DateField  (type: 'datefield')
Purpose:       A date field with typing and a calendar in a dropdown.
Anatomy:       TextField + calendar button; a Dropdown with a Calendar.
Config:        (TextField) + `value` (ISO string `YYYY-MM-DD` or null), `min`, `max` (ISO), `firstDay`. The displayed text follows the locale's day/month/year order (through `Intl`); there is no custom `format`.
               DECISION: the field value is always an ISO string (serializable, no time zone); the displayed text follows the locale.
API:           (Field) + `setMin`, `setMax`, `expand()`, `collapse()`.
Events:        `change(iso)`, `expand`, `collapse`.
States:        invalid when the text is not a valid date or is outside min/max (localized messages).
Keyboard/ARIA: Typing accepts the locale's order (and ISO); ↓ or Alt+↓ opens the calendar; arrows/PageUp/PageDown inside it (see Calendar); Esc closes. The input follows the WAI-ARIA APG date picker combobox: `role=combobox`, `aria-haspopup=dialog`, `aria-expanded`.
Tokens:        `--op-picker-arrow-fg` + the Calendar tokens.
Sandbox cases: empty, with a value, min/max, en and pt-BR locales, invalid while typing, readonly.
Out of scope:  time (DateTimeField/TimeField, P1), ranges (see DateRangeField, value `{ start, end }` in ISO).
