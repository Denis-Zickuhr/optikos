# Field (base)  (no type; abstract class `Field<V>`)
Purpose:       The common contract of fields: value, validation, dirty state, disabled, read-only, label and messages.
Anatomy:       `.op-field` > `label.op-field__label`, `.op-field__control` (filled by `createControl()`), `.op-field__help`, `.op-field__error[role=alert]`.
               State classes on the root: `is-invalid`, `is-dirty`, `is-readonly`, `is-disabled`, `is-focused`; `op-field--label-left`.
Config:        `name`, `label`, `labelPos: 'top'|'left'` (top), `value`, `required: false`, `readonly: false`, `disabled: false`,
               `help`, `stableSize: true`, `validators: Validator[]`, `validateOn: 'blur'|'change'|'submit'` (blur — after the first error it revalidates on every change), `debounce: 0` (ms of quiet after the last change before the `settled` event; works for **every** field). `displayFrom` (a lookup or picker: the key of the loaded record that holds its text, read by `form.load` / `setValues`).
API:           `getValue/setValue(v, silent?)`, `clear()` (empty value + `change`), `reset()` (back to the original value), `markClean()` (the current value becomes the original),
               `isDirty()`, `validate()` (updates the UI, returns a boolean), `isValid()` (no UI), `getError()`, `setError(msg)`, `clearError()`,
               `setLabel`, `setRequired`, `setReadonly`, `setDisabled`, `setHelp`, `setValidators`.
               For subclasses: `createControl(): HTMLElement`, `applyValue(v)` (value → DOM), `commit(v)` (DOM → value + `change`; it does **not** call `applyValue`: use it when the native control already shows the value, like an `<input>`),
               `isEmpty(v)`, `isEqual(a,b)`. A field without a native control (stars, slider) uses `setValue(v)`, which repaints through `applyValue` and fires `change` once.
Events:        `change(value, old)` (on every change, never delayed), `settled(value)` (the value after `debounce` ms without changes; without `debounce`, together with `change`; it fires right away on blur, on Enter and when a slider is released — use it for filters and searches), `focus`, `blur`, `invalid(message)`, `valid`, `dirty-change(isDirty)`.
States:        see Anatomy. `stableSize` (default): the error line is always reserved (the height of one small line), so the field does not grow when it becomes invalid. With `false`, the line only exists with an error.
               The same goes for the SuggestField spinner (`is-searching`): the input `padding` already reserves it. The Component `loading` mask is an overlay and does not change the size. The error is tied to the control by `aria-describedby` + `aria-invalid`.
Keyboard/ARIA: `label for=id`; `aria-required`; `aria-invalid`; the error message has `role="alert"` (announced when it appears).
Tokens:        `--op-field-gap`, `--op-field-label-fg/size/weight/width` (labelPos left), `--op-field-error-fg`, `--op-field-help-fg`, `--op-field-invalid-border`.
Sandbox cases: `stableSize` true vs false side by side (error on/off, Suggest search), (covered by the concrete fields) + a custom field example in the customization demo.
Out of scope:  input masks, async validation (validators are synchronous; remote checks use `setError` by hand).
Validator:     `(value, field) => string | true | undefined` — a string is the error message; `true`/`undefined` = ok. Built in: `required`, `minLength`, `maxLength`, `pattern`, `email`, `min`, `max`, `range`.
