# Stat  (type: 'stat')
Propósito:     Um card de KPI: rótulo, valor grande, a variação desde a última vez (boa ou ruim conforme a direção que você diz ser boa) e um sparkline opcional.
Anatomia:      `op-stat` > `op-stat__label` (+ ícone), `op-stat__row` (`op-stat__value`, `op-stat__delta` com `is-good`/`is-bad`/`is-flat`), `op-stat__caption` e um `Chart` sparkline (`op-stat__spark`).
Config:        `label`, `value` (número ou texto; `null` mostra —), `format` (formato registrado ou função, para número), `delta` (uma fração: `0.125` mostra `+12,5%`), `good: 'up'|'down'` (up; `down` para custos, erros, tempos de espera), `caption`, `icon`, `trend: number[]` (sparkline). `href` faz do bloco um link; `handler(stat, ev)` faz dele um botão (`role=button`, focável, com hover e anel de foco) para detalhar.
API:           `setLabel`, `setValue`, `setDelta`, `setCaption`, `setTrend`.
Eventos:       —
Estados:       Sem `delta`: a variação some. `delta` 0: neutro (`is-flat`).
Teclado/ARIA:  Bloco simples: não interativo. Com `href` ou `handler` é uma parada de Tab, Enter e Espaço chamam o handler, e o nome é "rótulo: valor" (ou `ariaLabel`). A variação é lida como texto ("subiu 12,5%"), não como seta; o sparkline tem o rótulo como nome.
Tokens:        `--op-stat-bg`, `--op-stat-radius`, `--op-stat-value-size`, `--op-stat-spark-width`, mais as cores semânticas de sucesso/perigo para a variação.
Casos sandbox: `data`: com e sem tendência, um custo (`good: 'down'`), formato de moeda, atualizado por `setValue`.
Fora do escopo: Seletor de período, períodos de comparação calculados por você.
