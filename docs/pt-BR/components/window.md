# Window  (type: 'window')
Propósito:     Panel flutuante e modal para diálogos e formulários de edição.
Anatomia:      `.op-window-backdrop` (camada) > `.op-window` (um Panel com `role=dialog`). Header serve de alça de arrasto.
Config:        (Panel) + `modal: true`, `mask: true` (escurece a página atrás de uma janela modal; `false` a mantém modal, mas sem escurecer), `draggable: true`, `closeOnEsc: true`, `closeOnBackdrop: false`, `closeAction: 'hide'|'destroy'` (destroy),
               `width` (padrão token), `autoFocus: false` (ao abrir o foco vai para o próprio diálogo, então o teclado do celular não aparece; `true` foca o 1º campo, ou o botão `primary`). `confirmDiscard: true | string`: fechar (X, Esc, `close()`) com um campo alterado dentro pergunta antes (`true` usa um texto padrão, uma string é a pergunta). Usa o `MessageBox` quando ele está carregado (o pacote completo sempre tem) e o `confirm` do navegador caso contrário.
API:           `show()`, `hide()`, `close()` (respeita `closeAction`), `center()`, `setMask(bool)`, `isVisible()`, + Panel.
Eventos:       `before-show`/`before-hide`/`before-close` (canceláveis), `show`, `hide`, `close`.
Estados:       `is-dragging`. Várias janelas empilham: a última aberta fica por cima e é a única que recebe foco/Esc.
Teclado/ARIA:  `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; focus trap (Tab circula); Esc fecha; ao fechar o foco volta ao elemento que abriu.
               Fundo (`inert` nos irmãos do layer) fica fora da árvore de acessibilidade enquanto modal.
Tokens:        `--op-window-bg/shadow/radius/min-width/max-width/max-height`, `--op-backdrop-bg`.
Casos sandbox: modal simples, com form, não modal, draggable, empilhadas, closeAction hide/destroy, com botões.
Fora do escopo: redimensionar, minimizar/maximizar, janelas dentro de um container (sempre no layer global).
