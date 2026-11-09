# CheckboxGroup  (type: 'checkboxgroup')
Propósito:     Várias escolhas entre poucas opções visíveis (canais de notificação, dias da semana). O valor é a lista dos valores marcados.
Anatomia:      Field > `div.op-checkboxgroup__options[role=group]` > um `label.op-checkbox` por opção (`input[type=checkbox]` + `.op-checkbox__box` + `.op-checkbox__text`); cada opção usa o visual do Checkbox.
Config:        (Field) + `options: (string|{value,label,disabled?})[]`, `direction: 'vertical'|'horizontal'` (vertical), `value: (string|number)[]` (padrão `[]`).
API:           (Field) + `setOptions(opções)`, `getDisplayText()` (os rótulos marcados, separados por vírgula). Atalho: `ui.checkGroup(nome, rótulo, opções, cfg?)`.
Eventos:       `change(valores, antigos)` — os valores na ordem das opções, não na ordem dos cliques.
Estados:       o rótulo de cada opção ganha `is-checked`; `required` significa ao menos um marcado.
Teclado/ARIA:  checkboxes nativos (Tab passa entre eles, Espaço alterna); o grupo é `role=group`, rotulado pelo rótulo do campo (`aria-labelledby`). O CSS se apoia no do Checkbox (`checkbox.css` + `checkboxgroup.css`).
Tokens:        `--op-checkboxgroup-gap`, mais os tokens do Checkbox.
Casos sandbox: `fields`: vertical, horizontal, opção desabilitada, obrigatório e inválido, dentro de um formulário.
Fora do escopo: "marcar todos" / limites de quantidade (mín./máx.: escreva um validador), opções com HTML livre.
