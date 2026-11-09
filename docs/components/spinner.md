# Spinner / LoadMask  (type: 'spinner'; the `loading` config on every Component)
Purpose:       Shows that something is loading: a standalone spinner and a mask over a component.
Anatomy:       Spinner: `<span class="op-spinner" role="progressbar">` (pure CSS). Mask: `.op-mask` (overlay) > `.op-spinner` + `.op-mask__text`, inside the component's `el`.
Config:        on Component: `loading: boolean | string` (a string is the mask text) and `setLoading(v)`. On Spinner: `label`.
               DECISION: the mask is part of the base `Component` (~20 lines) because Panel, Grid, Form and Window use it; the `spinner` component is just the element.
States:        `is-loading` on the target, `aria-busy="true"`; the content behind it becomes `inert`.
Keyboard/ARIA: `role=progressbar` without a value (indeterminate) + a localized `aria-label`; focus does not enter the masked area.
Tokens:        `--op-spinner-size/stroke/color`, `--op-mask-bg`.
Sandbox cases: standalone spinner (3 sizes), mask on a panel/grid/form, text on the mask, toggling it.
Out of scope:  a determinate ProgressBar (P1), Skeleton (P2).
