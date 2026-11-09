# RadioGroup  (type: 'radiogroup')
Propósito:     (Radio não existe solto: é uma opção do grupo.) Escolha única entre poucas opções visíveis. "Radio" é uma opção do grupo (não há componente solto).
Anatomia:      Field > `div.op-radiogroup[role=radiogroup]` > `label.op-radio` > `input[type=radio]` + `.op-radio__dot` + `.op-radio__text`.
Config:        (Field) + `options: (string|{value,label,disabled?})[]`, `direction: 'vertical'|'horizontal'` (vertical).
API:           (Field) + `setOptions`.
Eventos:       `change(value)`.
Teclado/ARIA:  Inputs nativos com o mesmo `name` (setas movem e selecionam, Tab entra/sai do grupo); grupo rotulado pelo label do campo (`aria-labelledby`).
Tokens:        `--op-radio-size/border/checked-bg/gap`.
Casos sandbox: vertical, horizontal, opção desabilitada, required inválido, valor inicial.
Fora do escopo: opções com HTML livre.
