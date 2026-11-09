# Breadcrumb  (type: 'breadcrumb')
Purpose:       Shows where the user is in a hierarchy and lets them go back to any level.
Anatomy:       `<nav class="op-breadcrumb" aria-label>` > `<ol class="op-breadcrumb__list">` > `<li>` with `a.op-breadcrumb__item` (item with `href`),
               `button.op-breadcrumb__item` (item with `handler`), or `span.op-breadcrumb__current[aria-current=page]` (the last one).
               When collapsed: `button.op-breadcrumb__more` ("…", `aria-haspopup=menu`) replaces the middle items. The separator is CSS (`li + li::before`).
Config:        `items: { text, icon?, href?, handler?(item) }[]`, `maxItems: 4` (minimum 3; above it the middle collapses: first + "…" + the last `maxItems - 2`),
               `separator: '›'` (text; becomes `--op-breadcrumb-separator`), `ariaLabel` (localized default "Breadcrumb").
API:           `setItems`, `setSeparator`, `setMaxItems`.
Events:        `before-navigate(item, index)` (cancelable; on an `<a>` it cancels the native navigation), `navigate(item, index)`. The last item never navigates.
States:        visible focus; the current item is not interactive.
Keyboard/ARIA: WAI-ARIA APG "Breadcrumb" pattern. Tab goes through the items (native links/buttons), Enter activates; "…" opens a Menu (↑↓, Enter, Esc, see Menu) with the hidden items, in order.
               `aria-current="page"` on the last one; separators are decorative (a pseudo-element, outside the accessibility tree).
Tokens:        `--op-breadcrumb-fg`, `--op-breadcrumb-hover-fg`, `--op-breadcrumb-current-fg`, `--op-breadcrumb-gap`, `--op-breadcrumb-separator`.
Sandbox cases: short, long with collapse (`maxItems`), with icons, custom separator, `before-navigate` canceling, light/dark/compact.
Out of scope:  a trail generated from a router (Router is P2), a dropdown of siblings at each level.
