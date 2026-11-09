# Toast  (function `toast()`; type: 'toast')
Purpose:       A temporary, non-blocking notification.
Anatomy:       One `.op-toast-region[aria-live]` per position in the layer > `.op-toast.op-toast--{type}` (`__icon`, `__text`, `__close`).
Config:        `toast(text | {text, title, type: 'info'|'success'|'warning'|'error', duration: 4000, closable: true, position: 'top-right'|'top-left'|'bottom-right'|'bottom-left'|'top'|'bottom'})` → `{ close() }`. `duration: 0` = stays.
API:           `toast.configure({position, duration, max})`, `handle.close()`.
Events:        `close` (on the Component).
Keyboard/ARIA: `role=status` (`alert` for errors), `aria-live`; the timer pauses on hover/focus; a localized close button; it never steals the focus.
Tokens:        `--op-toast-bg/fg/radius/shadow/accent-*` (one per type), `--op-toast-gap`.
Sandbox cases: 4 types, positions, sticky, stacking 5, the close action.
Out of scope:  action buttons inside the toast, toasts that persist across navigations.
