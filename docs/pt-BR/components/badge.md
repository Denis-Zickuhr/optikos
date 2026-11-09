# Badge  (type: 'badge')
Propósito:     Um pequeno rótulo de status ou contagem ("Pago", "3 novos", "Beta") ao lado de um texto, numa célula ou num cabeçalho. Não é interativo (veja Chip).
Anatomia:      `span.op-badge.op-badge--{tom}` > `.op-badge__dot` opcional (decorativo) e ícone, depois `.op-badge__text`.
Config:        `text` (texto ou número), `tone: 'neutral'|'primary'|'success'|'warning'|'danger'|'info'` (neutral), `icon`, `dot: false` (uma luz de status antes do texto).
API:           `setText(texto)`, `setTone(tom)`.
Eventos:       —
Estados:       —
Teclado/ARIA:  não recebe foco; o texto é lido como está. Quando o badge sozinho carrega o sentido (uma contagem num botão de ícone), dê ao botão um `ariaLabel` que a inclua.
Tokens:        `--op-badge-fg/bg` (sobrescrevem o tom), `--op-badge-radius`, `--op-badge-height`, `--op-badge-padding-x`, `--op-badge-font-weight`, `--op-badge-dot-size`, `--op-badge-icon-size`.
Casos sandbox: `base`: todos os tons, com ponto, com ícone, uma contagem.
Fora do escopo: badge posicionado no canto de outro elemento (posicione com CSS), tratar clique (use Chip ou Button).
