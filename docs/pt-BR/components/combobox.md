# ComboBox  (type: 'combobox')
Propósito:     Campo com lista de opções conhecidas; o usuário digita para filtrar localmente e escolhe.
Anatomia:      Field > `.op-picker` > `input[role=combobox]` + botão-seta; lista = ListBox dentro de um Dropdown (`matchWidth`).
Config:        (Field/TextField) + `options: (string|{value,label,disabled?})[]` ou `store`, `valueField: 'value'`, `displayField: 'label'`,
               `forceSelection: true` (texto fora da lista é descartado no blur), `filter: 'contains'|'startsWith'|fn` (contains), `emptyText` (sem resultados),
               `openOnFocus: false`, `maxHeight`.
API:           (Field) + `setOptions`, `setStore`, `getSelection()` (item), `setSelection(item)`, `expand()`, `collapse()`, `setEmptyText`.
Eventos:       `select(item)`, `expand`, `collapse`, `change(value)`.
Estados:       `is-open`; item ativo (`aria-activedescendant`); `has-value`.
Teclado/ARIA:  `role=combobox`, `aria-expanded`, `aria-controls`, `aria-autocomplete=list`, `aria-activedescendant`. Digitar filtra e destaca o primeiro resultado; setas movem item ativo (↓ abre), Enter escolhe,
               Esc fecha (2º Esc limpa se `clearable`), Home/End no popup, Tab escolhe o ativo se `forceSelection`.
Tokens:        `--op-picker-arrow-fg`, `--op-listbox-*` (ver ListBox).
Casos sandbox: lista curta, 5.000 itens (virtualizada), objetos {value,label}, forceSelection false, disabled/readonly, store.
Fora do escopo: seleção múltipla (TagField, P1), agrupamento visual de opções, templates HTML por item.
