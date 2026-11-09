# DateField  (type: 'datefield')
Propósito:     Campo de data com digitação e calendário em dropdown.
Anatomia:      TextField + botão de calendário; Dropdown com Calendar.
Config:        (TextField) + `value` (string ISO `YYYY-MM-DD` ou null), `min`, `max` (ISO), `firstDay`. O texto exibido é `dd/mm/aaaa` na ordem do locale (via `Intl`); não há `format` customizado.
               DECISÃO: o valor do campo é sempre string ISO (serializável, sem fuso); o texto exibido segue o locale.
API:           (Field) + `setMin`, `setMax`, `expand()`, `collapse()`.
Eventos:       `change(iso)`, `expand`, `collapse`.
Estados:       inválido se o texto não é data válida ou fora de min/max (mensagens localizadas).
Teclado/ARIA:  Digitar aceita a ordem do locale (e ISO); ↓ ou Alt+↓ abre o calendário; setas/PageUp/PageDown dentro dele (ver Calendar); Esc fecha. O input segue o combobox de "date picker" do WAI-ARIA APG: `role=combobox`, `aria-haspopup=dialog`, `aria-expanded`.
Tokens:        `--op-picker-arrow-fg` + tokens do Calendar.
Casos sandbox: vazio, com valor, min/max, locale en e pt-BR, inválido ao digitar, readonly.
Fora do escopo: hora (DateTimeField/TimeField, P1), intervalos (ver DateRangeField, valor `{ start, end }` em ISO).
