# Field (base)  (sem type; classe abstrata `Field<V>`)
Propósito:     Contrato comum dos campos: valor, validação, dirty, desabilitado, somente leitura, label e mensagens.
Anatomia:      `.op-field` > `label.op-field__label`, `.op-field__control` (preenchido por `createControl()`), `.op-field__help`, `.op-field__error[role=alert]`.
               Classes de estado no root: `is-invalid`, `is-dirty`, `is-readonly`, `is-disabled`, `is-focused`; `op-field--label-left`.
Config:        `name`, `label`, `labelPos: 'top'|'left'` (top), `value`, `required: false`, `readonly: false`, `disabled: false`,
               `help`, `stableSize: true`, `validators: Validator[]`, `validateOn: 'blur'|'change'|'submit'` (blur — depois do 1º erro, revalida a cada mudança), `debounce: 0` (ms de silêncio depois da última mudança antes do evento `settled`; vale para **todo** campo).
API:           `getValue/setValue(v, silent?)`, `clear()` (valor vazio + `change`), `reset()` (volta ao valor original), `markClean()` (valor atual vira o original),
               `isDirty()`, `validate()` (atualiza UI, retorna boolean), `isValid()` (sem UI), `getError()`, `setError(msg)`, `clearError()`,
               `setLabel`, `setRequired`, `setReadonly`, `setDisabled`, `setHelp`, `setValidators`.
               Para subclasses: `createControl(): HTMLElement`, `applyValue(v)` (valor → DOM), `commit(v)` (DOM → valor + `change`; **não** chama `applyValue`: use quando o controle nativo já mostra o valor, como um `<input>`),
               `isEmpty(v)`, `isEqual(a,b)`. Campo sem controle nativo (estrelas, slider) usa `setValue(v)`, que repinta via `applyValue` e emite `change` uma vez.
Eventos:       `change(value, old)` (a cada mudança, nunca adiado), `settled(value)` (o valor depois de `debounce` ms sem mudar; sem `debounce`, junto com `change`; sai antes na hora ao perder o foco, no Enter e ao soltar o slider — use para filtros e buscas), `focus`, `blur`, `invalid(message)`, `valid`, `dirty-change(isDirty)`.
Estados:       ver Anatomia. `stableSize` (padrão): a linha de erro é sempre reservada (altura de uma linha pequena), então o campo não cresce ao ficar inválido. Com `false`, a linha só existe com erro.
               O mesmo vale para o spinner do SuggestField (`is-searching`): o `padding` do input já o reserva. A máscara `loading` do Component é overlay e não altera tamanho. Erro é associado ao controle por `aria-describedby` + `aria-invalid`.
Teclado/ARIA:  `label for=id`; `aria-required`; `aria-invalid`; mensagem de erro com `role="alert"` (anunciada ao aparecer).
Tokens:        `--op-field-gap`, `--op-field-label-fg/size/weight/width` (labelPos left), `--op-field-error-fg`, `--op-field-help-fg`, `--op-field-invalid-border`.
Casos sandbox: `stableSize` true vs false lado a lado (erro ligado/desligado, busca do Suggest), (coberto pelos campos concretos) + campo custom de exemplo no demo de customização.
Fora do escopo: máscara de entrada, validação assíncrona (o validador pode ser síncrono apenas; remota fica para `setError` manual).
Validator:     `(value, field) => string | true | undefined` — string = mensagem de erro; `true`/`undefined` = ok. Prontos: `required`, `minLength`, `maxLength`, `pattern`, `email`, `min`, `max`, `range`.
