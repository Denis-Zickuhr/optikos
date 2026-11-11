# GridState  (type: 'gridstate')
Propósito:     Lembrar a grid por usuário: largura, ordem e visibilidade das colunas, a ordenação, os filtros, o tamanho da página e a página.
Anatomia:      Um plugin da Grid: `plugins: [persistState('grid-lotes')]`. Nada é adicionado ao DOM.
Config:        `persistState(key, { columns, sort, filters, page, delay })`: cada parte ligada por padrão; `delay` (300 ms) espera depois de uma mudança para salvar. Onde fica guardado: `setStateStorage({ get(key), set(key, value) })` (ambos podem ser assíncronos: um endpoint REST acompanha o usuário entre dispositivos); o padrão é `localStorage` em `optikos:<key>`. `loadState(key)` e `saveState(key, value)` servem para qualquer outra coisa que o app queira lembrar (densidade, painel recolhido).
API:           `persistState`, `setStateStorage`, `loadState`, `saveState`.
Eventos:       —
Estados:       Um armazenamento que falha (modo privado, offline) é ignorado: a grid só parte da sua configuração. Filtros em função não são salvos (só as especificações de filtro).
Teclado/ARIA:  —
Tokens:        —
Casos sandbox: `data`: redimensione uma coluna, ordene, recarregue a página.
Fora do escopo: Visões nomeadas e compartilhá-las (`ViewManager`), estado por linha.
