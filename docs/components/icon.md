# Icon  (type: 'icon')
Propósito:     Mostrar um ícone SVG embutido ou registrado pelo usuário.
Anatomia:      `<span class="op-icon">` com `<svg viewBox="0 0 24 24">` dentro; tamanho em `em`.
Config:        `name` (id registrado), `label` (se existir vira `role=img`+`aria-label`; senão `aria-hidden`).
API:           `setName`, `setLabel`; global: `registerIcons({ nome: '<path d=…/>' | '<svg…>' })`, `getIcon(name)`.
Eventos:       —
Teclado/ARIA:  decorativo por padrão.
Tokens:        `--op-icon-size` (padrão `1.25em`), `--op-icon-stroke` (largura do traço). Cor = `currentColor`.
Casos sandbox: todos os ícones embutidos, ícone registrado, tamanhos, cores, com label.
Fora do escopo: fontes de ícone, sprites externos. SVG registrado é confiável (vem do código do app, não de input do usuário).
