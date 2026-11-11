# NumberField  (type: 'numberfield')
Purpose:       A numeric field with limits, step and decimal places.
Anatomy:       TextField (`inputmode=decimal`) with a `number|null` value.
Config:        (TextField) + `min`, `max`, `step: 1`, `decimals` (undefined = free), `allowNegative` (derived from `min`). Money and percent through `Intl`: `format: 'decimal'|'currency'|'percent'`, `currency` (ISO 4217; default the locale's, or `setCurrency('BRL')`), `locale` (a BCP 47 tag for this field; default the active locale) — the same code shows `R$ 1.234,56` and `$1,234.56`. `scale: 100` keeps the value as an integer of cents (`123456` shows `1.234,56`); `min`/`max` and `step` follow the shown number (`step`) or the value (`min`/`max`). A percent stores the fraction (`0.15` shows `15%`).
API:           (Field) + `setMin`, `setMax`, `setStep`, `setDecimals`, `increment()`, `decrement()`.
Events:        `change(number|null)`.
States:        invalid when outside min/max or when the text is not a number.
Keyboard/ARIA: ↑/↓ add/subtract `step`, PageUp/PageDown ×10; `role=spinbutton` with `aria-valuemin/max/now`.
Tokens:        those of TextField.
Sandbox cases: integer, decimal with 2 places, min/max, step 5, empty, invalid text, pt-BR (decimal comma).
Out of scope:  currency formatting (CurrencyField, P1), the mouse wheel.
