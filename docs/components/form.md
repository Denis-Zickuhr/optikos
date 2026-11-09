# Form  (type: 'form')
Purpose:       A container of fields with values, validation and submission as a whole.
Anatomy:       `<form class="op-form" novalidate>` > items (Container). Default layout `vbox` with `gap`.
Config:        `items`, `tabs: [{ title, icon?, items, layout? }]` (shortcut: a `Tabs` with each tab's fields; still **one** form), `layout`, `labelPos` (passed to Fields that did not set it), `disabled`, `readonly`, `trackReset`.
API:           `getFields()`, `getField(name)`, `getValues({dirtyOnly?})`, `setValues(obj)`, `load(record)` (setValues + markClean),
               `reset()`, `markClean()`, `isDirty()`, `isValid()`, `validate()` (marks errors, focuses the 1st invalid one), `submit()`,
               `updateRecord(model)` (writes the changed values into a Model), `clearErrors()`.
Tabs:          `validate()` goes through every field, including tabs not opened yet; the 1st invalid one **activates its tab** and gets the focus. The tab header shows a badge with the error count (`has-error`) and a "changed" dot (`is-dirty`) — `Tabs.setTabState`. `getValues/load/reset/markClean` cross the tabs. It also works for any ancestor that shows one child at a time (`Tabs`, `card` layout).
Events:        `before-submit` (cancelable), `submit(values)` (only when valid), `invalid(fields)`, `dirty-change`, `load(record)`.
States:        `is-dirty`, `is-invalid`. `setDisabled` and `setReadonly` cascade to the fields.
Keyboard/ARIA: Enter in a field (except TextArea) submits; a button with `htmlType:'submit'` submits; the focus goes to the 1st invalid field; `role="form"` only with a label.
Tokens:        `--op-form-gap`.
Binding:       DECISION — a `name` with dots becomes a nested object (`address.city` ⇄ `{address:{city}}`). `load` takes a plain object or a `Model`
               (uses `model.data`). `getValues()` always returns a plain (serializable) object. `updateRecord(model)` calls `model.set` only for what changed.
               No automatic two-way binding: the optional `bind` (`optikos/bind`) can tie a field's `value` to a signal.
Sandbox cases: full form, load/reset/dirty, validation focusing the invalid field, cancelable submit, nested names.
Related:       `StepForm` (multi-step form, `stepform.md`) and `Stepper` (`stepper.md`).
Out of scope:  built-in HTTP submit (the app decides in the `submit` event), multipart uploads.
