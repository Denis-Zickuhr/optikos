# Toast  (função `toast()`; type: 'toast')
Propósito:     Notificação temporária não bloqueante.
Anatomia:      Região `.op-toast-region[aria-live]` por posição no layer > `.op-toast.op-toast--{type}` (`__icon`, `__text`, `__close`).
Config:        `toast(text | {text, title, type: 'info'|'success'|'warning'|'error', duration: 4000, closable: true, position: 'top-right'|'top-left'|'bottom-right'|'bottom-left'|'top'|'bottom'})` → `{ close() }`. `duration: 0` = fixo.
API:           `toast.configure({position, duration, max})`, `handle.close()`.
Eventos:       `close` (no Component).
Teclado/ARIA:  `role=status` (`alert` para error), `aria-live`; timer pausa com hover/foco; botão fechar localizado; não rouba foco.
Tokens:        `--op-toast-bg/fg/radius/shadow/accent-*` (um por tipo), `--op-toast-gap`.
Casos sandbox: 4 tipos, posições, fixo, empilhando 5, ação de fechar.
Fora do escopo: botões de ação dentro do toast, toasts persistentes entre navegações.
