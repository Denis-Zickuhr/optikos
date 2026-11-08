# SuggestField  (type: 'suggestfield')
Propósito:     Campo de busca com sugestões vindas de uma consulta assíncrona (cidade, cliente, CEP...).
Anatomia:      igual ao ComboBox, sem botão-seta; lupa à esquerda (`.op-suggest__icon`); indicador de carregando (`.op-picker__spinner`).
Config:        (ComboBox) + `query: (text, {signal}) => Promise<Item[]> | Item[]` ou `store` com proxy remoto (usa `store.load({query})`),
               `minChars: 1`, `delay: 250` (debounce em ms), `forceSelection: true`, `emptyText`, `highlight: true`, `showValue: false` (mostra o valor/id do registro como selo no início do campo, escondido enquanto se digita, e como dica no fim de cada linha da lista), `icon: 'search'` (lupa à esquerda; `false` esconde).
               `setSelection(item)` — para preencher sem consultar (o texto vem de `item.label`); `setValue(v)` só acha itens já carregados.
API:           (ComboBox) + `setQuery`, `search(text)`, `clearSuggestions()`.
Eventos:       `before-query(text)` (cancelável), `query(text)`, `load(items)`, `select(item)`, `error(err)`.
Estados:       (stableSize) o espaço do spinner é sempre reservado no input;
               `is-loading`, `is-open` (só se houver resultados ou `emptyText`).
Teclado/ARIA:  igual ao ComboBox; região `aria-live=polite` anuncia "N resultados". Respostas antigas são descartadas (AbortController) quando o texto muda.
Tokens:        os do ComboBox; `--op-picker-id-bg/fg` (selo do `showValue`), `--op-listbox-hint-fg`.
Casos sandbox: busca local com delay simulado, busca que falha, resultado vazio, forceSelection false (texto livre), valor pré-carregado.
Fora do escopo: cache de consultas, múltiplas seleções, agrupamento de resultados.
