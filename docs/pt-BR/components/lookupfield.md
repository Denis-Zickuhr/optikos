# LookupField  (type: 'lookupfield')
Propósito:     Escolher um registro de um conjunto grande (cliente, gerente, produto): digita e recebe sugestões, ou abre uma janela de pesquisa com filtros e grid pela lupa.
Anatomia:      igual ao `SuggestField` (`op-suggest`) + `op-lookup`; botão-lupa à direita (`.op-lookup__btn`, `aria-haspopup=dialog`) em vez do ícone decorativo.
               A lupa abre uma `Window` modal com um `SearchGrid` (filtros em cima, grid embaixo) e os botões Cancelar / Selecionar.
Config:        (SuggestField, incl. `showValue` para exibir o id do registro) + `lookup: LookupDef | string` (a definição, ou o nome dado a `registerLookup`; ver `searchgrid.md`).
               `valueField` (`id`) e `displayField` (`name`) vêm da definição; as sugestões digitadas filtram `queryField` (padrão: o 1º filtro) com `contains`. `displayFrom` (em qualquer campo; a chave do registro carregado que guarda o texto a mostrar: `{ name: 'event', displayFrom: 'eventName' }` faz `form.load({ event: 7, eventName: 'Gala' })` mostrar `Gala` sem pesquisa, também nas linhas de um `FieldList`). `setValue({ value, label })` faz o mesmo à mão.
API:           (SuggestField) + `openDialog()`. `getValue()` é o `valueField` do registro; `getSelection()` é `{ value, label, raw }`.
Eventos:       (SuggestField) `select(item)` ao escolher (na lista ou na janela), `change(value)`.
Estados:       disabled/readonly desabilitam a lupa; `is-searching` (spinner à esquerda da lupa).
Teclado/ARIA:  F4 ou Alt+↓ abre a janela (o texto digitado pré-preenche o filtro rápido); ↓/↑/Enter na lista de sugestões como no SuggestField;
               na janela: Enter num filtro pesquisa, Enter/duplo clique numa linha escolhe, Esc cancela e devolve o foco ao campo.
Tokens:        os do SuggestField e do SearchGrid.
Casos sandbox: `fields` (padrão, obrigatório, desabilitado); demos CRM ("Account manager" no cadastro de cliente) e admin ("Manager" em Settings).
Fora do escopo: seleção múltipla (o `selection: 'multi'` da definição vale só para o `SearchGrid` avulso; o campo usa o 1º registro), criar registro a partir da janela, campo sem edição de texto.
