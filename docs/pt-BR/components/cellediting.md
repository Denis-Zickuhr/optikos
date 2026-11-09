# CellEditing  (type: 'cellediting')
Propósito:     Plugin do Grid que edita células no lugar: duplo clique (ou F2/Enter) numa célula, digita, Enter grava. O valor vai para o registro, que fica alterado.
Anatomia:      `plugins: [cellEditing()]` no Grid; durante a edição a célula ganha `is-editing` e recebe um campo comum com `op-grid__editor` (sem rótulo, sem linha de erro reservada; o erro flutua sob a célula).
Config:        `cellEditing({ trigger: 'dblclick' | 'click' })` (dblclick). Em cada coluna: `editor: true` (um campo do tipo do valor: número → `numberfield`, booleano → `checkbox`, senão `textfield`), `editor: 'select'` (um tipo de campo) ou `editor: { type, ...configDoCampo }` (ex.: `{ type: 'select', options: [...] }`, `{ type: 'textfield', required: true }`), e `editable(registro) => boolean` para travar alguns registros.
               Os editores são criados pelo tipo via registry; com imports por componente, importe os tipos de campo que as colunas usam.
API:           nenhuma própria; o Grid ganha `cellAt(nó)`, `getCell(índice, campo)`, `getColumns()` e `getActive()`, que qualquer plugin pode usar.
Eventos:       no Grid: `before-edit(registro, campo)` (cancelável), `edit(registro, campo, valor, antigo)` (depois de gravar um valor válido com `record.set`), `edit-cancel(registro, campo)`.
Estados:       célula `is-editing`; o editor mostra `is-invalid` e a mensagem enquanto o valor não passa na validação (Enter/Tab não saem até ficar válido).
Teclado/ARIA:  F2 ou Enter na linha ativa editam a primeira célula editável; no editor, Enter grava e devolve o foco ao grid, Esc cancela, Tab/Shift+Tab gravam e vão para a próxima/anterior célula editável (atravessando linhas). O editor recebe o nome do cabeçalho da coluna (`aria-label`). Sair da célula ou rolar grava.
Tokens:        `--op-grid-editor-inset` (espaço em volta do editor na célula), mais os dos campos editores.
Casos sandbox: `data`: grid com editores de texto, número e select, coluna obrigatória, registro travado, log de eventos.
Fora do escopo: editar várias células de uma vez, modo de edição da linha inteira, desfazer, gravar no servidor (ouça `edit`, ou use `store.getModified()` e `store.sync()`).
