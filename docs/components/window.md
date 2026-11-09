# Window  (type: 'window')
Purpose:       A floating, modal panel for dialogs and edit forms.
Anatomy:       `.op-window-backdrop` (layer) > `.op-window` (a Panel with `role=dialog`). The header is the drag handle.
Config:        (Panel) + `modal: true`, `draggable: true`, `closeOnEsc: true`, `closeOnBackdrop: false`, `closeAction: 'hide'|'destroy'` (destroy),
               `width` (default from a token), `autoFocus: true` (the 1st focusable element or the `primary` button).
API:           `show()`, `hide()`, `close()` (follows `closeAction`), `center()`, `isVisible()`, + Panel.
Events:        `before-show`/`before-hide`/`before-close` (cancelable), `show`, `hide`, `close`.
States:        `is-dragging`. Windows stack: the last one opened is on top and is the only one that gets focus/Esc.
Keyboard/ARIA: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; focus trap (Tab cycles); Esc closes; on close the focus returns to the element that opened it.
               The background (`inert` on the layer's siblings) is out of the accessibility tree while modal.
Tokens:        `--op-window-bg/shadow/radius/min-width/max-width`, `--op-backdrop-bg`.
Sandbox cases: plain modal, with a form, non-modal, draggable, stacked, closeAction hide/destroy, with buttons.
Out of scope:  resizing, minimize/maximize, windows inside a container (always in the global layer).
