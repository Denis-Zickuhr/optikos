# Container  (type: 'container')
Purpose:       A component with children (`items`) and a layout; the node of the composite tree.
Anatomy:       `<div class="op-container">`; children inside `getBody()` (= el). The layout is applied with a class and custom properties.
Config:        `items: (ComponentConfig|Component|string)[]`, `layout: 'fit'|'hbox'|'vbox'|'border'|'grid'|'card'|{type, ...}|Layout`, `defaults` (config merged into every item), `narrowBelow` (px) is a shortcut for the layout option of the same name (a `border` layout's drawers, numeric `columns`): `{ layout: 'border', narrowBelow: 700 }`.
               `defaultType` ('container'), `gap` (token), `activeItem` (card).
API:           `add(item)`, `insert(i, item)`, `remove(itemOrId, destroy=true)`, `removeAll()`, `getItems()`, `get(id)`, `query(fn)`, `setLayout`, `setDisabled` (cascades to the children).
Events:        `add(child)`, `remove(child)`.
Keyboard/ARIA: no semantics of its own.
Layouts:       fit (one child fills it), hbox/vbox (flex; items take `flex`, `width`/`height`; config `align`, `justify`, `gap`, `wrap`),
               border (`region`: north|south|west|east|center; **responsive**: below `narrowBelow` px (768) west/east become *drawers* over the center, closed until `openRegion('west')`; `open: 'west'` starts one open; `layout.openRegion/closeRegion/toggleRegion/isRegionOpen`; the scrim and Esc close it), grid (`columns`, `gap`; item `colspan`; numeric columns become one column below `narrowBelow` px, 480; `0` turns it off), hbox (`stackBelow: px` stacks into a column below that width), card (one visible child; `setActive(i|id)`; `activeItem`).
Sandbox cases: every layout, nested, dynamic add/remove, defaults, a custom layout registered by the user.
Out of scope:  drag and drop between containers, absolute layouts.
