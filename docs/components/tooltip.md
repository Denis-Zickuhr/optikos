# Tooltip  (config `tooltip` em qualquer Component + `attachTooltip`)
Propósito:     Dica curta ao passar o mouse ou focar um elemento.
Anatomia:      Um único `.op-tooltip[role=tooltip]` no layer, reaproveitado. Alvos recebem `data-op-tip="texto"`.
Config:        no Component: `tooltip: 'texto'` (grava `data-op-tip`; precisa do módulo `optikos/components/tooltip` importado); global: `attachTooltip(el, text)`, `Tooltip.configure({delay: 400})`. Instalado por delegação (um listener no document).
Teclado/ARIA:  aparece também com foco do teclado; Esc esconde; o alvo ganha `aria-describedby` enquanto visível. Não mostra em touch.
Tokens:        `--op-tooltip-bg/fg/radius/padding/font-size/max-width`.
Casos sandbox: botão só com ícone, campo, texto longo (quebra), posição que vira (flip) na borda, tema escuro.
Fora do escopo: HTML/rich content (Popover, P1), tooltips que seguem o mouse.
