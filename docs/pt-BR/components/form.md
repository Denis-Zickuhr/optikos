# Form  (type: 'form')
Propósito:     Container de campos com valores, validação e envio como um todo.
Anatomia:      `<form class="op-form" novalidate>` > itens (Container). Layout padrão `vbox` com `gap`.
Config:        `items`, `tabs: [{ title, icon?, items, layout? }]` (atalho: um `Tabs` com os campos de cada aba; **um** formulário só), `layout`, `labelPos` (repassado aos Fields que não definiram), `labelWidth` (a largura dos rótulos à esquerda, para alinharem; número = px), `columns` (um layout de grade responsivo: uma coluna em telas estreitas; os itens aceitam `colspan`, um número ou `'full'`), `disabled`, `readonly`, `trackReset`.
Regras:        qualquer item dentro do formulário aceita `showIf: (values) => boolean` (mostrado só enquanto for verdadeiro) e `enableIf: (values) => boolean` (habilitado só enquanto for verdadeiro), reavaliados a cada mudança. Um campo escondido pela regra (ou dentro de um grupo escondido) fica fora de `validate()`, `isValid()` e `getValues()`, e o erro dele é limpo; um campo com `hidden: true` comum continua contando. Um campo desabilitado (por `enableIf` ou `disabled`) não é validado: o usuário não teria como corrigir.
API:           `getFields()`, `getField(name)`, `getValues({dirtyOnly?})`, `setValues(obj)`, `load(record)` (setValues + markClean), `focusField(field)` (abre a aba ou etapa dele e o foca), `applyRules()`,
               `reset()`, `markClean()`, `isDirty()`, `isValid()`, `validate()` (marca erros, foca o 1º inválido), `submit()`,
               `updateRecord(model)` (escreve os valores alterados num Model), `clearErrors()`, `setLabelWidth(largura)`.
Abas:          `validate()` percorre todos os campos, inclusive de abas ainda não abertas; o 1º inválido **ativa a aba dele** e recebe foco. O cabeçalho da aba mostra um selo com a contagem de erros (`has-error`) e um ponto de "alterado" (`is-dirty`) — `Tabs.setTabState`. `getValues/load/reset/markClean` atravessam as abas. Vale também para qualquer ancestral que escolha um filho visível (`Tabs`, layout `card`).
Eventos:       `before-submit` (cancelável), `submit(values)` (só se válido), `invalid(fields)`, `dirty-change(dirty)` (quando o formulário como um todo passa a ter mudanças ou volta ao original), `load(record)`.
Estados:       `is-dirty`, `is-invalid`. `setDisabled` e `setReadonly` descem para os campos.
Teclado/ARIA:  Enter num campo (exceto TextArea) envia; botão com `htmlType:'submit'` envia; foco vai ao 1º campo inválido; `role="form"` só com label.
Tokens:        `--op-form-gap`.
Binding:       DECISÃO — `name` com ponto vira objeto aninhado (`address.city` ⇄ `{address:{city}}`). `load` aceita objeto simples ou `Model`
               (usa `model.data`). `getValues()` sempre devolve objeto simples (serializável). `updateRecord(model)` faz `model.set` só do que mudou.
               Sem two-way automático: o `bind` opcional (`optikos/bind`) pode ligar `value` de um campo a um signal.
Casos sandbox: formulário completo, load/reset/dirty, validação com foco no inválido, submit cancelável, nomes aninhados.
Relacionados:  `StepForm` (formulário em etapas, `stepform.md`) e `Stepper` (`stepper.md`).
Fora do escopo: submit HTTP embutido (o app decide no evento `submit`), upload multipart.
