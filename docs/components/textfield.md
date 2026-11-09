# TextField  (type: 'textfield')
Purpose:       A single-line text field; also the base of TextArea, NumberField, PickerField and DateField.
Anatomy:       inherits the Field anatomy; the control is an `<input class="op-textfield__input">`.
Config:        (Field) + `inputType: 'text'|'email'|'tel'|'url'|'search'|'password'` (text), `placeholder`, `maxLength`, `minLength`,
               `pattern`, `autocomplete`, `selectOnFocus: false`, `clearable: false`.
API:           (Field) + `setPlaceholder`, `setMaxLength`, `setInputType`, `select()`, `getInput()`.
Events:        (Field) + `enter(text)` when Enter is pressed. `change` fires on every edit (the value is always the current text) and on `setValue`. For searches and filters use `debounce: 300` and listen to `settled` (Enter also fires `settled` right away).
States:        (Field) + `has-value` (for a floating label/clearable in CSS).
Keyboard/ARIA: a native `<input>` tied to its `<label for>`; `aria-invalid`, `aria-describedby` (error and help), `aria-required`. Esc clears when `clearable`.
Tokens:        `--op-textfield-bg/fg/border/border-focus/radius/padding-x/padding-y/placeholder`.
Sandbox cases: label top/left, placeholder, required, readonly, disabled, invalid, maxLength, clearable, password, enter.
Out of scope:  masks (MaskField, P1), prefix/suffix and inner icons (P1).
