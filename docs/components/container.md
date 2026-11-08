# Container  (type: 'container')
Propósito:     Componente que tem filhos (`items`) e um layout; nó do Composite.
Anatomia:      `<div class="op-container">`; filhos dentro de `getBody()` (= el). Layout aplicado por classe + custom properties.
Config:        `items: (ComponentConfig|Component|string)[]`, `layout: 'fit'|'hbox'|'vbox'|'border'|'grid'|'card'|{type, ...}|Layout`, `defaults` (config mesclada em cada item),
               `defaultType` ('container'), `gap` (token), `activeItem` (card).
API:           `add(item)`, `insert(i, item)`, `remove(itemOrId, destroy=true)`, `removeAll()`, `getItems()`, `get(id)`, `query(fn)`, `setLayout`, `setDisabled` (desce aos filhos).
Eventos:       `add(child)`, `remove(child)`.
Teclado/ARIA:  sem semântica própria.
Layouts:       fit (1 filho preenche), hbox/vbox (flex; itens com `flex`, `width`/`height`; config `align`, `justify`, `gap`, `wrap`),
               border (`region`: north|south|west|east|center; **responsivo**: abaixo de `narrowBelow` px (768) west/east viram *drawers* sobre o centro, fechados até `openRegion('west')`; `open: 'west'` abre um já no início; `layout.openRegion/closeRegion/toggleRegion/isRegionOpen`; o scrim e a tecla Esc fecham), grid (`columns`, `gap`; item `colspan`; colunas numéricas viram 1 coluna abaixo de `narrowBelow` px, 480; `0` desliga), hbox (`stackBelow: px` empilha em coluna abaixo dessa largura), card (um filho visível; `setActive(i|id)`; `activeItem`).
Casos sandbox: cada layout, aninhados, add/remove dinâmico, defaults, layout customizado registrado pelo usuário.
Fora do escopo: drag and drop entre containers, layouts absolutos.
