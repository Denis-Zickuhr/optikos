# Window  (type: 'window')
Propósito:     Panel flutuante e modal para diálogos e formulários de edição.
Anatomia:      `.op-window-backdrop` (camada) > `.op-window` (um Panel com `role=dialog`). Header serve de alça de arrasto.
Config:        (Panel) + `modal: true`, `draggable: true`, `closeOnEsc: true`, `closeOnBackdrop: false`, `closeAction: 'hide'|'destroy'` (destroy),
               `width` (padrão token), `autoFocus: true` (1º elemento focável ou o botão `primary`).
API:           `show()`, `hide()`, `close()` (respeita `closeAction`), `center()`, `isVisible()`, + Panel.
Eventos:       `before-show`/`before-hide`/`before-close` (canceláveis), `show`, `hide`, `close`.
Estados:       `is-dragging`. Várias janelas empilham: a última aberta fica por cima e é a única que recebe foco/Esc.
Teclado/ARIA:  `role="dialog"` + `aria-modal="true"` + `aria-labelledby`; focus trap (Tab circula); Esc fecha; ao fechar o foco volta ao elemento que abriu.
               Fundo (`inert` nos irmãos do layer) fica fora da árvore de acessibilidade enquanto modal.
Tokens:        `--op-window-bg/shadow/radius/min-width/max-width`, `--op-backdrop-bg`.
Casos sandbox: modal simples, com form, não modal, draggable, empilhadas, closeAction hide/destroy, com botões.
Fora do escopo: redimensionar, minimizar/maximizar, janelas dentro de um container (sempre no layer global).
