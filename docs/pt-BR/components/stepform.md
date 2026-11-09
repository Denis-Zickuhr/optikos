# StepForm  (type: 'stepform')
Propósito:     Formulário longo guiado por etapas (dados → endereço → contato → revisão), com validação por etapa e resumo final. É **um** formulário: `getValues`, `load`, `dirty`, `reset` valem para todas as etapas.
Anatomia:      `form.op-form.op-stepform` > `Stepper` (topo) + corpo (`layout: card`, uma etapa visível por vez, `.op-stepform__step`) + rodapé (`Cancelar` · Voltar · Próximo · Concluir).
Config:        (Form) + `steps: [{ title, description?, icon?, optional?, items, layout? }]` (layout padrão da etapa: grid de 2 colunas, 1 no celular),
               `linear: true` (não se avança sem validar as etapas do caminho; `false` deixa clicar em qualquer etapa), `review: false | true | (values, form) => string | Node`
               (acrescenta a etapa "Revisão" com o resumo dos valores; a função substitui o resumo padrão), `reviewTitle`, `backText`, `nextText`, `finishText`, `cancelText` (mostra o botão Cancelar).
API:           (Form) + `next()`, `back()`, `goTo(i)` (devolve se foi), `getStep()`, `getStepCount()`, `validateStep(i)`, `getStepper()`.
Eventos:       `before-step-change(from, to)` (cancelável), `step-change(to, from)`, `finish(values)` (só depois de todas as etapas validarem), `cancel`, e os do Form (`submit`, `invalid`...).
Fluxo:         Próximo só avança se os campos da etapa atual validam (o 1º inválido recebe foco e a etapa fica em erro); Voltar sempre volta e preserva os valores.
               Concluir valida **todas** as etapas; se alguma falha, vai até ela. Enter num campo de uma linha = Próximo (na última etapa = Concluir).
               Com `linear: true`, clicar numa etapa à frente valida as do caminho e para na primeira inválida.
Estados:       etapas do Stepper: atual, feita (já validada), com erro (falhou ao validar). A etapa de revisão é remontada toda vez que se entra nela.
Teclado/ARIA:  Enter avança; o stepper tem `aria-current="step"`; a mudança de etapa leva o foco ao 1º campo da nova etapa; botões nativos.
Tokens:        `--op-stepform-gap`, `--op-stepform-step-padding` (+ os do Stepper).
Casos sandbox: `form`: cadastro em 4 etapas com revisão, dentro de uma `Window` (modal) e na página, etapa opcional, modo não linear.
Fora do escopo: etapas condicionais/ramificadas, salvar rascunho entre etapas (use `getValues`/`load`), validação assíncrona por etapa.
