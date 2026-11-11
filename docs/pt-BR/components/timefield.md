# TimeField  (type: 'timefield')
Propósito:     Hora do dia em 24 h, digitada ou ajustada pelo teclado (horário de funcionamento, hora de consulta, início de turno).
Anatomia:      Igual ao `TextField` (`op-textfield`) + `op-timefield`: um input com `inputmode="numeric"`.
Valor:         `'HH:mm'` (ex.: `'09:30'`) ou `null`. Digitar `930`, `9:30` ou `09:30` dá `'09:30'`; o texto é normalizado ao sair do campo. Texto que não é hora vira erro (`Informe uma hora, como 09:30`), não é descartado em silêncio.
Config:        (TextField) + `min`, `max` (`'HH:mm'`), `step: 1` (minutos movidos por ↑/↓).
API:           `getValue()`, `setValue('HH:mm' | null)`, `setMin()`, `setMax()`, mais a API de TextField/Field.
Eventos:       `change`, `enter`.
Estados:       os do Field (`is-invalid`, `is-readonly`, `is-disabled`).
Teclado/ARIA:  ↑/↓ movem `step` minutos, PageUp/PageDown uma hora. Com `min`/`max` o valor para nos limites; sem eles volta à meia-noite (dá a volta).
Tokens:        os do `TextField`.
Casos sandbox:    `fields`: livre, com limites e passo.
Fora do escopo:  segundos, exibição 12 h / AM-PM, dropdown de relógio, fusos horários.
