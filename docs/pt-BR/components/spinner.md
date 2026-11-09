# Spinner / LoadMask  (type: 'spinner'; config `loading` em todo Component)
Propósito:     Indicar carregamento: spinner solto e máscara sobre um componente.
Anatomia:      Spinner: `<span class="op-spinner" role="progressbar">` (CSS puro). Máscara: `.op-mask` (overlay) > `.op-spinner` + `.op-mask__text`, dentro do `el` do componente.
Config:        no Component: `loading: boolean | string` (string = texto da máscara) e `setLoading(v)`. No Spinner: `label`.
               DECISÃO: a máscara faz parte do `Component` base (~20 linhas) porque Panel, Grid, Form e Window a usam; o componente `spinner` é só o elemento.
Estados:       `is-loading` no alvo, `aria-busy="true"`; o conteúdo atrás fica `inert`.
Teclado/ARIA:  `role=progressbar` sem valor (indeterminado) + `aria-label` localizado; foco não entra na área mascarada.
Tokens:        `--op-spinner-size/stroke/color`, `--op-mask-bg`.
Casos sandbox: spinner solto (3 tamanhos), máscara em panel/grid/form, texto na máscara, ligar/desligar.
Fora do escopo: ProgressBar determinada (P1), Skeleton (P2).
