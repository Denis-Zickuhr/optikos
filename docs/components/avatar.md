# Avatar  (type: 'avatar')
Purpose:       A picture or the initials of a name, on a color picked from the name, so the same person always looks the same.
Anatomy:       `op-avatar` (`op-avatar--sm|md|lg|xl`, `--circle|--square`, `has-image`) > `op-avatar__img`, `op-avatar__text`, `op-avatar__status` (`is-online|away|busy`).
Config:        `name` (initials, color and accessible name), `src` (if it fails to load the initials show), `size: 'sm'|'md'|'lg'|'xl'` (md), `shape: 'circle'|'square'` (circle), `status: 'online'|'away'|'busy'|'offline'`.
API:           `setName`, `setSrc`, `setStatus`.
Events:        —
States:        With picture / without (initials).
Keyboard/ARIA: `role=img` named by `ariaLabel` or `name`; the picture is decorative.
Tokens:        `--op-avatar-size` (and `-sm|-lg|-xl`), `--op-avatar-dot`, `--op-avatar-ring`, `--op-avatar-radius`; the fill is one of `--op-chart-1`…`8`.
Sandbox cases: `base`: sizes, shapes, status, a broken picture.
Out of scope:  A stack of avatars with a "+3" (compose with a `container` and negative margins), upload.
