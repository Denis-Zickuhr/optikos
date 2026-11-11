# Shortcuts  (type: 'shortcuts')
Purpose:       Keyboard shortcuts registered globally or per screen (scope), without conflicts, with a help panel on `?`.
Anatomy:       An object, not a component: `shortcuts.register`, `setScope`, `list`, `help`. The help panel is a `Window` with `op-shortcuts` > `op-shortcuts__group`, `__row`, `__kbd`.
Config:        `shortcuts.register({ keys, title, handler, scope?, group?, when?, inInputs? })` (or an array); returns the function that removes it. `keys`: `'mod+s'` (`mod` = Ctrl, or ⌘ on a Mac), `'alt+n'`, `'shift+?'`, `'g'`. `scope` defaults to `global`; `setScope('lots')` activates that screen's shortcuts besides the global ones, and they win over a global one with the same keys. `when()` is checked on every press. A shortcut without Ctrl/⌘/Alt is ignored while typing in a field unless `inInputs`. The same keys twice in a scope warn in dev and the newest wins.
API:           `shortcuts.register(s | s[])`, `setScope(name | undefined)`, `getScope()`, `list()` (what is active now), `help()` (open or close the panel), `formatKeys('mod+s')` (`⌘S` or `Ctrl+S`).
Events:        —
States:        `?` (Shift+/) opens the help panel from anywhere but a text field.
Keyboard/ARIA: The panel is a modal window (focus trapped, Esc closes) listing each shortcut as a `<kbd>`.
Tokens:        Those of `Window`; the rows use `--op-space-*` and `--op-color-*`.
Sandbox cases: `overlays`: global shortcuts, two screens with their own, the help panel.
Out of scope:  Key sequences (`g` then `i`), user-remappable keys, platform-specific keys beyond `mod`.
