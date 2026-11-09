# Icon  (type: 'icon')
Purpose:       Shows a built-in SVG icon or one registered by the user.
Anatomy:       `<span class="op-icon">` with an `<svg viewBox="0 0 24 24">` inside; sized in `em`.
Config:        `name` (registered id), `label` (when set it becomes `role=img`+`aria-label`; otherwise `aria-hidden`).
API:           `setName`, `setLabel`; global: `registerIcons({ name: '<path d=…/>' | '<svg…>' })`, `getIcon(name)`.
Events:        —
Keyboard/ARIA: decorative by default.
Tokens:        `--op-icon-size` (default `1.25em`), `--op-icon-stroke` (stroke width). Color = `currentColor`.
Sandbox cases: every built-in icon, a registered icon, sizes, colors, with a label.
Out of scope:  icon fonts, external sprites. A registered SVG is trusted (it comes from the app's code, not from user input). The built-in paths come from Lucide (ISC) and Feather (MIT): see THIRD_PARTY_NOTICES.md.
