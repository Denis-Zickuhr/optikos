# RowEditing  (type: 'rowediting')
Propósito:      Editar uma linha inteira de uma vez, sob uma barra Salvar / Cancelar, como plugin da Grid (o plugin `rowediting` do Ext). Reaproveita o `editor` das colunas e a validação dos campos.
Anatomia:       A linha ganha `is-row-editing`; cada célula editável guarda um campo (`op-grid__editor`, `is-editing`) e uma barra `op-grid__rowbar` com dois botões (`op-grid__rowbtn`, `is-primary`) pende sob a linha.
Config:         `rowEditing({ trigger: 'dblclick' | 'click' })` (dblclick). Em cada coluna: `editor` (`true`, um tipo de campo ou uma config) e `editable(rec)`, exatamente como no `cellEditing()` (use um dos dois, não os dois).
API:            Nenhuma própria; usa `getRowEntry`, `cellAt`, `getCell`, `getColumns` e `getActive` da Grid.
Eventos:        Na Grid: `before-edit(record)` (cancelável), `edit(record, values, old)` depois que os novos valores foram escritos com `record.set` (só os campos alterados; num store remoto o app salva daqui — o plugin nunca chama a API), `cancel-edit(record)`.
Estados:        Editando / não. Salvar valida todos os campos e mantém a linha aberta, com foco no primeiro inválido. Abrir outra linha salva a aberta antes (e não sai se ela for inválida). Rolar a linha para fora da janela renderizada cancela.
Teclado/ARIA:   Duplo clique, ou Enter / F2 na linha ativa, abre. Esc cancela; Enter (fora de textarea e de botão) salva; Tab percorre os editores e os dois botões e volta ao início. A barra é `role=group` com o nome "Editando linha".
Tokens:         `--op-grid-row-selected-bg` (a linha), `--op-grid-editor-inset`, mais os tokens semânticos de cor da barra.
Casos sandbox:  `data`: uma grid com editores de texto, número e select; um campo obrigatório; um salvamento estilo remoto a partir do evento `edit`.
Fora do escopo: Chamar a API por você, editar entre linhas (em lote), editor formulário-numa-janela (use uma `Window` com um `Form`).
