# FormErrors  (type: 'formerrors')
Propósito:     Um resumo de erros para formulários longos: depois de uma validação com falhas, lista cada problema como um botão que leva ao campo (abrindo a aba ou a etapa dele), e diminui conforme os problemas são corrigidos.
Anatomia:      `.op-formerrors[role=alert]` > `.op-formerrors__title` ("Corrija 2 problemas antes de salvar") + `ul.op-formerrors__list` > `li` > `button.op-formerrors__link` ("Email: Este campo é obrigatório"). Oculto até o formulário ser validado com erros.
Config:        (Component) + `title` (uma função `(n) => string`, ou um texto fixo; padrão "Corrija {n} problemas antes de salvar"), `focus: false` (`true`: o resumo recebe o foco depois de um envio com falha, em vez do primeiro campo inválido).
API:           `getErrors()` (os campos com erro, em ordem), `refresh()`. Ele encontra o seu Form subindo pelos pais.
Eventos:       `go(field)` quando um link é usado.
Estados:       oculto quando não há nada a corrigir.
Teclado/ARIA:  `role=alert`, então é anunciado quando aparece; cada problema é um botão (Tab, Enter) que mostra e foca o campo. Com `focus: true` o próprio resumo recebe o foco (`tabindex=-1`), o padrão de resumo de erros do GOV.UK.
Tokens:        `--op-formerrors-bg`, `--op-formerrors-border`, `--op-formerrors-fg`.
Casos sandbox: no topo de um formulário longo em abas (um link abre a aba certa), corrigindo os problemas um a um, `focus: true`.
Fora do escopo: erros do servidor que não são de um campo (mostre um Toast ou um Label), avisos.
