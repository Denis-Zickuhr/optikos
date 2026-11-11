# MaskField  (type: 'maskfield')
Propósito:     Um campo de texto que formata o que se digita num padrão (telefone, CPF/CNPJ, CEP, placa, IBAN). O core não conhece país: os padrões são do app.
Anatomia:      Como `TextField` (`op-textfield`) + `op-maskfield`; o placeholder é o padrão (`___.___.___-__`).
Valor:         O texto formatado (`'123.456.789-00'`), ou com `raw: true` só o que entrou nos espaços (`'12345678900'`). `setValue` aceita as duas formas e normaliza.
Config:        (TextField) + `mask: string | string[]`: `0` um dígito, `A` uma letra, `*` qualquer caractere, `\` torna o próximo caractere literal. Uma lista escolhe o padrão pelo tamanho: `['000.000.000-00', '00.000.000/0000-00']` é CPF até o 12º dígito, depois CNPJ. `raw`. Valor incompleto é erro (`Complete o formato ___.___`). Dígito verificador ou outra regra vai em `validators`. `stored: string`: um valor que o app guarda mas só mostra mascarado (`'***.***.***-12'`) aparece só leitura; `getValue()` é `null` enquanto intocado (manter o salvo) e conta como preenchido para `required`; digitar, Enter ou Espaço o substitui, Esc na substituição vazia o devolve (`is-stored`).
API:           (TextField) + `setMask(mask)`. `isStored()`, `replaceStored()`, `keepStored()`.
Eventos:       `change(value)`, `enter`.
Estados:       Os do Field.
Teclado/ARIA:  Digitar, colar e apagar reformatam e o cursor fica depois do mesmo caractere digitado; `inputmode=numeric` quando todos os espaços são dígitos.
Tokens:        Os do `TextField`.
Casos sandbox: `fields`: CPF/CNPJ com dois padrões, `raw`, uma placa, um validador com dígito verificador.
Fora do escopo: Número, moeda e percentual (`NumberField` com `format`), arquivos de presets por país no core, máscaras que mostram caracteres de preenchimento dentro do texto.
