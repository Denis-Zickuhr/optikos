# Badge  (type: 'badge')
Purpose:       A small status label or count ("Paid", "3 new", "Beta") next to text, in a table cell or a header. Not interactive (see Chip).
Anatomy:       `span.op-badge.op-badge--{tone}` > optional `.op-badge__dot` (decorative) and icon, then `.op-badge__text`.
Config:        `text` (string or number), `tone: 'neutral'|'primary'|'success'|'warning'|'danger'|'info'` (neutral), `icon`, `dot: false` (a status light before the text).
API:           `setText(text)`, `setTone(tone)`.
Events:        —
States:        —
Keyboard/ARIA: not focusable; the text is read as is. When a badge alone carries meaning (a count on an icon button), give the button an `ariaLabel` that includes it.
Tokens:        `--op-badge-fg/bg` (override the tone), `--op-badge-radius`, `--op-badge-height`, `--op-badge-padding-x`, `--op-badge-font-weight`, `--op-badge-dot-size`, `--op-badge-icon-size`.
Sandbox cases: `base`: every tone, with a dot, with an icon, a count.
Out of scope:  a badge positioned over another element's corner (place it with CSS), click handling (use Chip or Button).
