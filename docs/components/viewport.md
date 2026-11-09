# Viewport  (type: 'viewport')
Purpose:       The root container that fills the whole window (default layout `fit`).
Anatomy:       `<div class="op-viewport">` (`position:fixed; inset:0`), mounted on `document.body`.
Config:        (Container) + `renderTo` (body). Only one per document (a second one throws).
API:           (Container).
Keyboard/ARIA: no semantics; the children define regions (`main`, `nav`).
Tokens:        `--op-viewport-bg`, `--op-viewport-fg`.
Responsive:    What adapts is the container's *layout* (measured on the container itself, not the window): `border` with drawers, `grid` and `hbox` that stack. See `container.md`. The `narrow-change(bool)` event tells the app; the container gets the `is-narrow` class.
Sandbox cases: border layout with a sidebar/topbar, nesting with Tabs.
Out of scope:  several viewports, iframes.
