# ViewManager  (type: 'viewmanager')
Propósito:     Salvar e restaurar a "visão" de uma tela de dados: colunas visíveis e sua ordem, filtros (com os grupos AND/OR) e ordenação, com nome, para o usuário voltar a ela.
Anatomia:      `.op-viewmanager` > um `Button` ghost "Visões ▾" (mostra o nome da visão ativa) que abre um `Menu`:
               as visões (✓ na ativa, ★ na padrão), Salvar visão, Salvar como nova visão…, Abrir com esta visão, Excluir visão, Voltar ao inicial.
Config:        `grid` (obrigatório), `filters` (um `FilterBuilder`; opcional), `storage: ViewStorage` (obrigatório),
               `extra: { chave: { get(), set(v) } }` (qualquer outra coisa da interface a lembrar: densidade, painel recolhido...; vai em `state.extra`), `autoLoad: true` (aplica a visão padrão ao abrir).
Armazenamento: `ViewStorage { list(), save(view), remove(view) }` (síncrono ou Promise). O app implementa para o seu endpoint; prontos:
               `localViewStorage(key, storage = localStorage)` (usado nos demos) e `restViewStorage({ url, headers?, fetch? })` (`GET url`, `POST url`, `PUT url/:id`, `DELETE url/:id`, JSON).
               Erros do storage viram o evento `error` (nada estoura para a tela).
Dados:         `SavedView { id?, name, default?, state: ViewState }`, `ViewState { columns: ColumnState[], filter: FilterGroup | null, sorters: Sorter[], extra }`: JSON puro.
API:           `getState()`, `setState(state)`, `getViews()`, `getCurrent()`, `reload()`, `apply(view|id)`, `save()` (atualiza a ativa; sem ativa, pede o nome), `saveAs(name?)` (pede o nome; nome existente sobrescreve), `setDefault(on)`, `remove(view?)` (confirma), `reset()` (volta ao estado de quando abriu).
Eventos:       `load(views)`, `before-apply(view)` (cancelável), `apply(view)`, `save(view)`, `remove(view)`, `reset`, `error(err)`.
Estados:       o botão mostra o nome da visão ativa.
Teclado/ARIA:  botão com `aria-haspopup=menu`; o menu é o `Menu` padrão (setas, Enter, Esc); a confirmação e o pedido de nome são `MessageBox` (modais com foco preso).
Tokens:        os do Button e do Menu.
Casos sandbox: `data`: visões em localStorage (recarregue a página) e em "servidor" simulado (`restViewStorage` com fetch falso e log das chamadas). Demo CRM.
Fora do escopo: visões compartilhadas/por usuário (é decisão do endpoint), indicador de "visão modificada", renomear (salve com outro nome).
