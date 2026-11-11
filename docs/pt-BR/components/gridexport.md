# GridExport  (type: 'gridexport')
Propósito:     Exportar uma grid em CSV ou Excel (.xlsx) e imprimi-la como tabela simples. Sem biblioteca: o .xlsx é escrito à mão.
Anatomia:      Funções, não um componente: `exportGrid(grid, options)` e `printGrid(grid, options)`. A impressão usa uma `op-print-sheet` temporária e a classe `op-printing` no `<html>`.
Config:        `exportGrid`: `format: 'csv'|'xlsx'` (csv), `filename` (`export`), `scope: 'all'|'page'` (all: todos os registros que passam pela ordenação e filtros, em todas as páginas; um store remoto é lido página a página pelo proxy), `pageSize` (500, para store remoto), `download: false` (só monta o arquivo). `printGrid`: `title`, `scope`, `pageSize`.
API:           `exportGrid(grid, o): Promise<Blob>`, `printGrid(grid, o): Promise<void>`; `Store.fetchAll(pageSize?)` é quem lê "tudo".
Eventos:       —
Estados:       As colunas são as visíveis, na ordem atual; os valores como mostrados (moeda, datas), e um número que ninguém formatou continua número no Excel. Uma célula que começa com `=`, `+` ou `@` vai entre aspas para não rodar como fórmula.
Teclado/ARIA:  —
Tokens:        A impressão usa `--op-font-family`, `--op-color-*`, `--op-space-*`. A tabela repete o cabeçalho em cada página e não parte uma linha.
Casos sandbox: `data`: botões de CSV, Excel e Imprimir numa grid com colunas de moeda e data.
Fora do escopo: Várias planilhas, estilos e larguras de coluna no .xlsx, fórmulas, PDF (imprima para PDF pelo navegador), importar.
