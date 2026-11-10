# FieldGroup  (type: 'fieldgroup')
Propósito:     Vários inputs lidos como um campo só: um rótulo, uma linha de ajuda e uma linha de erro sobre uma linha de campos (um telefone = DDI + número, uma data de nascimento = dia + mês + ano, uma linha de endereço = rua + número). Cada input mantém seu próprio nome e valor.
Anatomia:      `.op-field.op-fieldgroup[role=group]` > `.op-field__label` (nomeia o grupo) + `.op-field__control` > `.op-fieldgroup__body` (os campos, em linha) + `.op-field__help` + `.op-field__error`. Dentro, o rótulo de cada campo fica oculto visualmente (continua sendo o nome acessível) e as linhas de ajuda e de erro de cada um não aparecem.
Config:        (Container) + `label`, `help`, `required` (a marca `*`; aparece também quando algum campo dentro é obrigatório), `labelPos: 'top' | 'left'` (padrão: o do formulário), `stackBelow` (px: abaixo dessa largura a linha vira coluna). Layout padrão `hbox`; cada campo cresce por igual, a menos que defina `flex` ou `width`.
API:           `setLabel(texto)`, `setHelp(texto)`, `getFields()`, `getError()` (o primeiro erro dentro), + Container.
Eventos:       `invalid(mensagem)` e `valid` quando a linha de erro do grupo muda.
Estados:       `is-invalid`, `is-required`, `op-field--label-left`.
Teclado/ARIA:  `role=group` nomeado pelo rótulo e descrito pela ajuda e pelo erro; Tab passa pelos inputs; um clique no rótulo foca o primeiro. Cada input continua nomeado pelo próprio rótulo (oculto), então o leitor de tela diz "Telefone, grupo — DDI".
Tokens:        `--op-fieldgroup-gap`.
Casos sandbox: telefone (select + texto), data de nascimento (três números), linha de endereço, obrigatório e com erro, rótulo à esquerda num formulário com `labelWidth`, empilhado em telas estreitas.
Fora do escopo: um valor único para o grupo todo (cada input mantém o nome: use `name: 'phone.number'` para aninhar), máscaras.
