# Spacer  (type: 'spacer')
Purpose:       Flexible or fixed space (and a visual separator) in toolbars and flex layouts.
Anatomy:       `<span class="op-spacer">`; without `width`/`flex` it takes the free space (`flex:1`).
Config:        `width`, `flex`, `line: false` (becomes a 1px vertical separator, from a token).
Keyboard/ARIA: `aria-hidden`; the line uses `role=separator`.
Tokens:        `--op-spacer-line`.
Sandbox cases: fill, fixed, separator.
Out of scope:  —
