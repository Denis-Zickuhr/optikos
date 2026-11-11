# StepForm  (type: 'stepform')
Propósito:     Formulário longo guiado por etapas (dados → endereço → contato → revisão), com validação por etapa e resumo final. É **um** formulário: `getValues`, `load`, `dirty`, `reset` valem para todas as etapas.
Anatomia:      `form.op-form.op-stepform` > `Stepper` (topo) + corpo (`layout: card`, uma etapa visível por vez, `.op-stepform__step`) + rodapé (`Cancelar` · Voltar · Próximo · Concluir).
Config:        (Form) + `steps: [{ title, description?, icon?, optional?, items, layout?, validate? }]` (layout padrão da etapa: grid de 2 colunas, 1 no celular;
               `validate(values, form, signal)` é uma checagem da etapa que pode consultar o servidor e devolve, ou resolve com, `true`, uma mensagem para a etapa ou `{ campo: mensagem }`),
               `linear: true` (não se avança sem validar as etapas do caminho; `false` deixa clicar em qualquer etapa), `review: false | true | (values, form) => string | Node`
               (acrescenta a etapa "Revisão" com o resumo dos valores; a função substitui o resumo padrão), `reviewTitle`, `backText`, `nextText`, `finishText`, `cancelText` (mostra o botão Cancelar).
API:           (Form) + `next()`, `back()`, `goTo(i)` (cada um resolve com se foi; na hora quando não há `validate` de etapa no caminho), `getStep()`, `getStepCount()`, `validateStep(i)`, `getStepper()`.
Eventos:       `before-step-change(from, to)` (cancelável), `step-change(to, from)`, `finish(values)` (só depois de todas as etapas validarem), `cancel`, e os do Form (`submit`, `invalid`...).
Fluxo:         Próximo só avança se os campos da etapa atual validam (o 1º inválido recebe foco e a etapa fica em erro); Voltar sempre volta e preserva os valores.
               Concluir valida **todas** as etapas; se alguma falha, vai até ela. Enter num campo de uma linha = Próximo (na última etapa = Concluir).
               Com `linear: true`, clicar numa etapa à frente valida as do caminho e para na primeira inválida.
               O `validate` de uma etapa roda depois que os campos dela passam, ao sair dela para a frente e de novo no Concluir: Próximo e Concluir ficam
               em loading (`is-validating` no form) e um segundo clique não faz nada; mensagens por campo marcam esses campos, um texto (ou um erro lançado)
               aparece numa linha de alerta acima da etapa. Voltar aborta a checagem (o `signal`); com checagens, Concluir devolve `false` e `finish` dispara quando elas passam.
Estados:       etapas do Stepper: atual, feita (já validada), com erro (falhou ao validar). A etapa de revisão é remontada toda vez que se entra nela; uma FieldList mostra uma linha por item.
Teclado/ARIA:  Enter avança; o stepper tem `aria-current="step"`; a mudança de etapa leva o foco ao painel da nova etapa (`autoFocus: true`: ao 1º campo dela, o que abre o teclado do celular); botões nativos.
Tokens:        `--op-stepform-gap`, `--op-stepform-step-padding` (+ os do Stepper).
Casos sandbox: `form`: cadastro em 4 etapas com revisão, dentro de uma `Window` (modal) e na página, etapa opcional, modo não linear, checagem da etapa contra um servidor (simulado).
Fora do escopo: etapas condicionais/ramificadas, salvar rascunho entre etapas (use `getValues`/`load`), validadores assíncronos por campo (use o `validate` da etapa).
