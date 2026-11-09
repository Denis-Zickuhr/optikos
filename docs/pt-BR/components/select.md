# Select  (type: 'select')
Propósito:     Escolher uma opção de uma lista fechada, sem digitar texto livre.
Anatomia:      Igual ao ComboBox, mas o `input[role=combobox]` é `readonly` e exibe o rótulo; clique em qualquer parte abre.
Config:        (ComboBox sem filtro) `options`/`store`, `valueField`, `displayField`, `placeholder`, `clearable: false`.
API/Eventos:   Como o ComboBox. Digitar letras salta para a opção que começa com elas (typeahead, buffer de 600 ms).
Estados:       `is-open`, `has-value`, invalid/readonly/disabled (Field).
Teclado/ARIA:  `role=combobox` + `aria-haspopup=listbox`; ↑↓ abrem/movem, Enter/Space escolhem, Esc fecha, letras fazem typeahead.
Tokens:        os do ComboBox.
Casos sandbox: strings, {value,label}, desabilitada, opção desabilitada, clearable, pré-selecionada, typeahead.
Fora do escopo: múltipla seleção (TagField), `<select>` nativo mobile.
