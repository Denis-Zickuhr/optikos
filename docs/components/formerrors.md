# FormErrors  (type: 'formerrors')
Purpose:       An error summary for long forms: after a failed validation it lists every problem as a button that takes you to the field (opening its tab or step), and it shrinks as the problems get fixed.
Anatomy:       `.op-formerrors[role=alert]` > `.op-formerrors__title` ("Fix 2 problems before saving") + `ul.op-formerrors__list` > `li` > `button.op-formerrors__link` ("Email: This field is required"). Hidden until the form is validated with errors.
Config:        (Component) + `title` (a function `(n) => string`, or a fixed text; default "Fix {n} problems before saving"), `focus: false` (`true`: the summary takes the focus after a failed submit instead of the first invalid field).
API:           `getErrors()` (the fields with an error, in order), `refresh()`. It finds its Form by walking up its parents.
Events:        `go(field)` when a link is used.
States:        hidden when there is nothing to fix.
Keyboard/ARIA: `role=alert`, so it is announced when it appears; each problem is a button (Tab, Enter) that reveals and focuses its field. With `focus: true` the summary itself takes the focus (`tabindex=-1`), the GOV.UK error-summary pattern.
Tokens:        `--op-formerrors-bg`, `--op-formerrors-border`, `--op-formerrors-fg`.
Sandbox cases: at the top of a long tabbed form (a link opens the right tab), fixing the problems one by one, `focus: true`.
Out of scope:  server errors that are not tied to a field (show a Toast or a Label), warnings.
