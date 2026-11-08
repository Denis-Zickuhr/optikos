# DateRangeField  (type: 'daterangefield')
Propósito:     Escolher um período (início e fim) num só campo: relatórios, filtros, reservas.
Anatomia:      igual ao `DateField` (`op-datefield`) + `op-daterange`: input com `01/11/2026 – 15/11/2026`, botão-calendário, Dropdown com `Calendar range`.
Config:        (TextField) + `value: { start, end } | null` (ISO), `min`, `max`, `firstDay`.
               Texto aceito: `início – fim`, `início - fim`, `início to fim`, `início a fim` (um só dia vale como período de um dia; fim antes do início é invertido).
API:           (Field) + `open/close/toggle`, `setMin`, `setMax`. `clear()` zera.
Eventos:       (Field) `change({start, end})`, `expand`, `collapse`.
Estados:       `is-open`, inválido: `Informe uma data válida` (texto), `dateMin` / `dateMax` (o período inteiro precisa caber).
Teclado/ARIA:  ↓ abre o calendário (foco no dia), dois Enter/cliques escolhem início e fim (o 2º fecha e devolve o foco); Esc fecha. Input com `aria-haspopup=dialog` / `aria-expanded`.
Tokens:        os do `DateField` e do `Calendar` (`--op-calendar-range-bg/fg`).
Casos sandbox: vazio, com valor, min/max, obrigatório, somente leitura, `Calendar range` avulso.
Fora do escopo: atalhos de período ("este mês"), dois calendários lado a lado, intervalo com hora.
Decisão:       os extremos se chamam `start`/`end` (a primeira ideia, em docs/internal/fixes.md, era `from`/`to`): casam com `Calendar` e com o `between` do filtro (`[start, end]`).
