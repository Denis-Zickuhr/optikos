# Alert  (type: 'alert')
Purpose:       A message in the page, not over it: a form or sign-in error, "nothing here yet", a notice.
Anatomy:       `op-alert` (`op-alert--info|success|warning|danger`) > `op-alert__icon`, `op-alert__body` (`__title`, `__text`), `op-alert__close`.
Config:        `tone: 'info'|'success'|'warning'|'danger'` (info), `title`, `text`, `icon` (by tone; `false` leaves it out), `closable`, `role: 'alert'|'status'|'note'` (`alert` for warning and danger, `status` for the others).
API:           `setTone`, `setTitle`, `setText`, `setIcon`, `close()` (hides it; `show()` brings it back).
Events:        `close` (the button or `close()`).
States:        Hidden parts (no title, no text, no icon) take no room.
Keyboard/ARIA: `role=alert` is read at once when it appears; `status` politely. The icon is decorative; the close button is a normal button named "Close". The tone is never colour alone: the icon and the text carry it.
Tokens:        `--op-alert-bg`, `--op-alert-fg`, `--op-alert-radius`, `--op-alert-accent`, `--op-alert-icon-offset`; tone colours come from the theme (`--op-color-info|success|warning|danger` and their `-soft`).
Sandbox cases: `feedback`: the four tones, with title, closable, and used as an empty state.
Out of scope:  Auto-dismiss (that is `toast`), actions inside it (put a Button next to it), a floating position.
