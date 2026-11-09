# NumberField  (type: 'numberfield')
Purpose:       A numeric field with limits, step and decimal places.
Anatomy:       TextField (`inputmode=decimal`) with a `number|null` value.
Config:        (TextField) + `min`, `max`, `step: 1`, `decimals` (undefined = free), `allowNegative` (derived from `min`).
API:           (Field) + `setMin`, `setMax`, `setStep`, `setDecimals`, `increment()`, `decrement()`.
Events:        `change(number|null)`.
States:        invalid when outside min/max or when the text is not a number.
Keyboard/ARIA: ↑/↓ add/subtract `step`, PageUp/PageDown ×10; `role=spinbutton` with `aria-valuemin/max/now`.
Tokens:        those of TextField.
Sandbox cases: integer, decimal with 2 places, min/max, step 5, empty, invalid text, pt-BR (decimal comma).
Out of scope:  currency formatting (CurrencyField, P1), the mouse wheel.
