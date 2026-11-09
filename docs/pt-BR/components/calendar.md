# Calendar  (type: 'calendar')
Propósito:     Calendário de seleção de um dia (DatePicker); usado pelo DateField.
Anatomia:      `.op-calendar` > `__header` (prev, título, next), `__grid[role=grid]` (dias) ou grade de meses; `__day`, `is-today`, `is-selected`, `is-outside`.
Config:        `value` (ISO; com `range: true`, `{ start, end }`), `range: false` (dois cliques: início e fim; o segundo clique antes do início inverte; `end` é `null` até o 2º clique), `min`, `max`, `firstDay` (do locale), `isDisabled(iso) => boolean`.
API:           `setValue`, `setRange(bool)`, `setMin`, `setMax`, `showMonth(year, month)`, `focusDay()`.
Eventos:       `select(iso)` (range: `select({start, end})` só no 2º clique; `start(iso)` no 1º),  `navigate(year, month)`.
Teclado/ARIA:  Grade com `role=grid`, dias `role=gridcell` + `aria-selected`, `aria-label` com data por extenso. ←→ ±1 dia, ↑↓ ±1 semana, Home/End semana,
               PageUp/PageDown ±1 mês, Shift+Page ±1 ano, Enter/Space escolhe. Título alterna dia ↔ mês.
Tokens:        `--op-calendar-bg/day-size/day-hover-bg/day-selected-bg/day-selected-fg/today-border/outside-fg/range-bg/range-fg`. Classes de intervalo: `is-in-range`, `is-range-start`, `is-range-end`.
Casos sandbox: mês atual, valor, min/max, dias desabilitados, pt-BR (semana começa no domingo; en conforme locale), foco por teclado, intervalo (`range: true`, com `min`/`max`).
Fora do escopo: pré-visualização do período ao passar o mouse, atalhos de período ("últimos 7 dias"), múltiplos meses, Scheduler (P2).
