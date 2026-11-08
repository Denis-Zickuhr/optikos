# TextField  (type: 'textfield')
Propósito:     Campo de texto de uma linha; também base de TextArea, NumberField, PickerField e DateField.
Anatomia:      herda a anatomia de Field; controle = `<input class="op-textfield__input">`.
Config:        (Field) + `inputType: 'text'|'email'|'tel'|'url'|'search'|'password'` (text), `placeholder`, `maxLength`, `minLength`,
               `pattern`, `autocomplete`, `selectOnFocus: false`, `clearable: false`.
API:           (Field) + `setPlaceholder`, `setMaxLength`, `setInputType`, `select()`, `getInput()`.
Eventos:       (Field) + `enter(text)` ao pressionar Enter. `change` dispara a cada edição (o valor é sempre o texto atual) e em `setValue`.
Estados:       (Field) + `has-value` (para label flutuante/clearable em CSS).
Teclado/ARIA:  `<input>` nativo ligado ao `<label for>`; `aria-invalid`, `aria-describedby` (erro e ajuda), `aria-required`. Esc limpa se `clearable`.
Tokens:        `--op-textfield-bg/fg/border/border-focus/radius/padding-x/padding-y/placeholder`.
Casos sandbox: label top/left, placeholder, required, readonly, disabled, inválido, maxLength, clearable, password, enter.
Fora do escopo: máscara (MaskField, P1), prefixo/sufixo e ícones internos (P1).
