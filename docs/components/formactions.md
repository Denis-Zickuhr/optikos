# FormActions  (type: 'formactions')
Purpose:       The form's action bar: Cancel (resets) and Save (submits), an "Unsaved changes" status, and optionally sticky at the bottom of a long form or only enabled once something changed.
Anatomy:       `.op-formactions` > `.op-formactions__status` (a polite live region) + `.op-formactions__buttons` (extra buttons, Cancel, Save: `.op-button`s). `.is-sticky` sticks it to the bottom of the scrolling area.
Config:        (Component) + `submitText` (default "Save"), `cancelText` (default "Cancel"; `false` hides Cancel), `buttons` (extra Button configs, before Cancel), `sticky: false`, `requireChanges: false` (Save is disabled until the form is dirty), `status: true` (the "Unsaved changes" line).
API:           `getForm()`, `setSubmitText(text)`, `setCancelText(text | false)`, `setSticky(bool)`. It finds its Form by walking up its parents.
Events:        `cancel` (cancelable: return `false` to keep the changes), then the form resets.
States:        `is-dirty`, `is-sticky`.
Keyboard/ARIA: Save is a real `type=submit` button (Enter in a field submits too); the status line is `aria-live=polite`, so "Unsaved changes" is announced once when it appears.
Tokens:        `--op-formactions-bg`, `--op-formactions-border`, `--op-formactions-padding`.
Sandbox cases: plain, `requireChanges`, sticky at the bottom of a long form, an extra "Save as draft" button, Cancel asking first (`cancel` returning false after a confirm).
Out of scope:  autosave, a "saved 2 minutes ago" clock.
