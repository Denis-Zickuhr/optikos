# Chart  (type: 'chart')
Propósito:     Gráficos de barra, linha, área, pizza, rosca e sparkline em SVG, alimentados por dados ou por um `Store` (o mesmo da grid), coloridos pelo tema.
Anatomia:      `op-chart` > `op-chart__plot` (`op-chart__svg` + `op-chart__tip`) + `op-chart__legend` (botões `op-chart__key`) + uma `<table>` oculta visualmente com os mesmos dados para leitores de tela. Marcas: `op-chart__bar`, `__line`, `__area`, `__dot`, `__slice`; uma faixa transparente `op-chart__hit` por categoria recebe o ponteiro.
Config:        `kind: 'bar'|'line'|'area'|'pie'|'donut'|'sparkline'` (bar), `x` (campo com a categoria ou o nome da fatia), `series: (campo | { field, label?, color? })[]` (pizza e rosca desenham a primeira), `data` ou `store` (qualquer mudança do store repinta uma vez, mesmo numa rajada de patches ao vivo), `stacked` (barra e área), `legend` (padrão: mais de uma série, ou pizza), `format` (um formato registrado como `money` ou uma função; padrão `number`), `title` (nome acessível e legenda da tabela), `height` (240; sparkline 36).
API:           `setData(rows)`, `setStore(store)`, `setKind(kind)`, `setSeries(series)`.
Eventos:       `point(record, index)` quando o tooltip chega a uma categoria ou fatia.
Estados:       Vazio (mostra o texto `empty`), série escondida pela legenda (`aria-pressed`, `is-off`).
Teclado/ARIA:  O gráfico é uma parada de Tab (`role=img`, nomeado por `title`): ←/→ (↑/↓) percorrem categorias ou fatias e mostram o tooltip, Home/End saltam, Esc esconde. As chaves da legenda são botões. Os dados também estão numa tabela para tecnologia assistiva.
Tokens:        `--op-chart-1`…`--op-chart-8` (as cores das séries, no tema: seguem o modo escuro e o white-label), `--op-chart-line-width`, `--op-chart-font-size`, `--op-chart-area-opacity`, `--op-chart-grid`, `--op-chart-fg`, `--op-chart-tip-width`.
Casos sandbox: `data`: todos os tipos, empilhado, um store com patches ao vivo, tema escuro.
Fora do escopo: Zoom e seleção, barras horizontais, eixo duplo, anotações, exportar como imagem (use o navegador), 3D.
