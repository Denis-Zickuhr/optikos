# Toggle  (type: 'toggle')
Propósito:     Interruptor liga/desliga para um ajuste que vale na hora (notificações, modo escuro). Um Checkbox com aparência e papel de interruptor.
Anatomia:      Como o Checkbox: Field > `label.op-checkbox__label` > `input[type=checkbox][role=switch]` + `.op-checkbox__box` (o trilho; o `::after` é a bolinha) + `.op-checkbox__text` (`boxLabel`); raiz `op-toggle`.
Config:        (Field) + `boxLabel`, `value: false`. Igual ao Checkbox, sem `indeterminate` (interruptor não tem terceiro estado).
API:           (Field) + `setBoxLabel`, `toggle()`. Atalho: `ui.toggle(nome, boxLabel?, cfg?)`.
Eventos:       `change(boolean)`.
Estados:       `is-checked` (ligado), `is-disabled`, `is-readonly`.
Teclado/ARIA:  input checkbox nativo com `role="switch"` e `aria-checked`: Espaço alterna; o rótulo alterna no clique. O CSS se apoia no do Checkbox (`optikos/css/checkbox.css` + `toggle.css`).
Tokens:        `--op-toggle-width`, `--op-toggle-height`, `--op-toggle-knob-inset`, `--op-toggle-track-bg`, `--op-toggle-on-bg`, `--op-toggle-knob-bg`.
Casos sandbox: `fields`: ligado, desligado, desabilitado, somente leitura, dentro de um formulário.
Fora do escopo: texto dentro do trilho ("on/off"), estado de carregando enquanto salva (use `loading` no formulário ou no campo).
