# Avatar  (type: 'avatar')
Propósito:     Uma foto ou as iniciais de um nome, sobre uma cor escolhida pelo nome, então a mesma pessoa sempre tem a mesma aparência.
Anatomia:      `op-avatar` (`op-avatar--sm|md|lg|xl`, `--circle|--square`, `has-image`) > `op-avatar__img`, `op-avatar__text`, `op-avatar__status` (`is-online|away|busy`).
Config:        `name` (iniciais, cor e nome acessível), `src` (se não carregar, aparecem as iniciais), `size: 'sm'|'md'|'lg'|'xl'` (md), `shape: 'circle'|'square'` (circle), `status: 'online'|'away'|'busy'|'offline'`.
API:           `setName`, `setSrc`, `setStatus`.
Eventos:       —
Estados:       Com foto / sem foto (iniciais).
Teclado/ARIA:  `role=img` nomeado por `ariaLabel` ou `name`; a imagem é decorativa.
Tokens:        `--op-avatar-size` (e `-sm|-lg|-xl`), `--op-avatar-dot`, `--op-avatar-ring`, `--op-avatar-radius`; o fundo é um de `--op-chart-1`…`8`.
Casos sandbox: `base`: tamanhos, formas, status, uma foto quebrada.
Fora do escopo: Pilha de avatares com "+3" (componha com um `container` e margens negativas), upload.
