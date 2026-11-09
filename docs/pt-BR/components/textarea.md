# TextArea  (type: 'textarea')
Propósito:     Texto de várias linhas.
Anatomia:      TextField com `<textarea class="op-textfield__input op-textarea__input">`.
Config:        (TextField) + `rows: 3`, `autoGrow: false`, `maxRows`.
API/Eventos:   Como TextField; Enter insere quebra (não dispara `enter` nem envia o Form; Ctrl+Enter dispara `enter`).
Teclado/ARIA:  `<textarea>` nativo; `aria-multiline` implícito.
Tokens:        os do TextField + `--op-textarea-min-height`.
Casos sandbox: fixo, autoGrow com maxRows, maxLength, disabled/readonly.
Fora do escopo: editor rico (HtmlEditor, P2), contador de caracteres.
