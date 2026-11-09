# Dropdown  (type: 'dropdown')
Purpose:       A floating panel anchored to an element; the base of Select/ComboBox/Suggest/DateField/Menu (and Popover, P1).
Anatomy:       `.op-dropdown[role=…]` inside the global layer (`body > .op-layer`). It takes `data-op-theme` from the anchor's ancestor.
Config:        `anchor: HTMLElement|Component`, `content: HTMLElement|ComponentConfig|Component`, `placement` ('bottom-start'),
               `offset: 4`, `matchWidth: false`, `flip: true` (opens upwards when it does not fit), `closeOnOutside: true`, `closeOnEsc: true`,
               `role` ('dialog'), `autoFocus: false`, `ariaLabel`.
API:           `open()`, `close()`, `toggle()`, `isOpen()`, `setAnchor`, `setContent`, `setPlacement`, `reposition()`.
Events:        `before-open`/`before-close` (cancelable), `open`, `close`.
States:        `is-open`; the anchor gets `aria-expanded` (whoever uses the Dropdown sets `aria-haspopup`/`aria-controls`).
Keyboard/ARIA: Esc closes and gives the focus back to the anchor; a click outside closes (capturing pointerdown, ignoring the anchor); repositions on scroll/resize.
               A `dialog` dropdown without `ariaLabel` is named by its anchor (`aria-labelledby`).
Tokens:        `--op-dropdown-bg/border/radius/shadow/z`.
Sandbox cases: below/above (flip), matchWidth, any content, closes outside/Esc, inside a scroller, inside a dark theme.
Out of scope:  arrows pointing at the anchor (Popover, P1); JS animations (CSS only).
