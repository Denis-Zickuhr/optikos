# DateTimeField  (type: 'datetimefield')
Propósito:     Uma data e uma hora lado a lado, num só valor (início de evento, prazo, consulta).
Anatomia:      `op-field op-datetimefield` > `op-datetimefield__parts` (role group) com um `DateField` e um `TimeField` (os rótulos próprios ficam ocultos; cada um se chama "Data" e "Hora").
Valor:         `'YYYY-MM-DDTHH:mm'` (local) ou `null`. Com `utc: true` o valor é o instante ISO (`'2026-11-10T17:30:00.000Z'`) do que o usuário digitou no seu fuso, e volta a ser mostrado em hora local. Uma parte sem a outra ainda não é valor: `null`, e erro na validação.
Config:        (Field) + `min`, `max` (datas, `YYYY-MM-DD`), `step` (minutos movidos por ↑/↓ na parte da hora), `utc`.
API:           (Field) + `setMin`, `setMax`.
Eventos:       `change(value, old)` quando as duas partes estão preenchidas ou uma é limpa.
Estados:       Os do Field; desabilitado e somente leitura chegam às duas partes.
Teclado/ARIA:  Como `DateField` (↓ abre o calendário) e `TimeField` (↑/↓ ajustam).
Tokens:        `--op-datetimefield-gap`, mais os de `DateField` e `TimeField`.
Casos sandbox: `fields`: local, `utc`, com `min`/`max`.
Fora do escopo: Escolha de fuso, segundos, intervalo de data-hora.
