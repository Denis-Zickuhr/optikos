# Tooltip  (the `tooltip` config on any Component + `attachTooltip`)
Purpose:       A short hint when hovering or focusing an element.
Anatomy:       One shared `.op-tooltip[role=tooltip]` in the layer. Targets get `data-op-tip="text"`.
Config:        on Component: `tooltip: 'text'` (writes `data-op-tip`; needs the `optikos/components/tooltip` module imported); global: `attachTooltip(el, text)`, `Tooltip.configure({delay: 400})`. Installed by delegation (one listener on the document).
Keyboard/ARIA: also shows on keyboard focus; Esc hides it; the target gets `aria-describedby` while it is visible. Not shown on touch.
Tokens:        `--op-tooltip-bg/fg/radius/padding/font-size/max-width`.
Sandbox cases: an icon-only button, a field, long text (wraps), a position that flips at the edge, dark theme.
Out of scope:  HTML/rich content (Popover, P1), tooltips that follow the mouse.
