# QuickSearch  (plugin: `quickSearch()`)
Propósito:      Uma caixa de busca dentro da grid, na linha da paginação (ao lado dos botões de exportar e agrupar): as linhas em que algum dos campos contém o texto.
Anatomia:       `op-quicksearch__group` (`op-footer-group`) na linha `op-grid__footer` da grid, com um TextField limpável `op-quicksearch`.
Config:         `quickSearch({ fields, delay?, placeholder? })`: `fields` são os campos do registro buscados (qualquer um que bata mantém a linha: um `or` de `contains`), `delay` ms depois da última tecla (250), `placeholder`.
API:            —; filtra o store da grid.
Eventos:        O `filter` do store.
Estados:        Outros filtros (um FilterBuilder) ficam e se combinam com ela (AND); um filtro que os substitui limpa a caixa. Texto vazio tira só o filtro dela.
Teclado/ARIA:   Um campo de texto chamado "Buscar na grid"; o botão de limpar como em qualquer TextField.
Tokens:         `--op-quicksearch-width`.
Casos sandbox:  `data`: uma grid paginada buscando nome e cidade, ao lado dos ícones de exportar.
Fora do escopo: Destacar o que bateu, busca aproximada, buscar colunas que não são campos do registro, sintaxe de busca remota (um store remoto filtra no servidor).
