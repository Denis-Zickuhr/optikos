# Stepper  (type: 'stepper')
Propósito:     Indicador de etapas de um processo (cadastro, checkout, importação): onde estou, o que já foi, o que falhou. Base do `StepForm`.
Anatomia:      `ol.op-stepper` > `li.op-stepper__step` (`is-current`, `is-done`, `is-error`, `is-optional`) > `button.op-stepper__btn` > `__marker` (número, ✓ ou !) + `__text` (`__title`, `__desc`, "opcional"); a linha entre etapas é o `::after` do item.
Config:        `steps: [{ id?, title, description?, icon?, optional? }]`, `active: 0`, `clickable: true` (clicar numa etapa), `ariaLabel`.
API:           `setActive(i)`, `getActive()`, `setStepState(i, 'pending'|'done'|'error')`, `getStepState(i)`, `setSteps(list)`.
Eventos:       `before-select(i)` (cancelável: o dono decide se pode ir), `select(i)` (depois de `setActive`). Sem ouvinte, clicar só troca a etapa.
Estados:       por etapa: `current`, `done`, `error`, `pending`; `optional` mostra "opcional".
Teclado/ARIA:  `<ol>` com `aria-label`; a etapa atual tem `aria-current="step"`; cada etapa é um botão (Tab/Enter/Espaço), desabilitado quando `clickable: false`; estado de erro/feito dito em texto escondido ("concluída", "com erro").
               No celular só a etapa atual mostra o texto; as outras o mantêm escondido só visualmente, então todo botão continua com nome.
Tokens:        `--op-stepper-marker-size`, `--op-stepper-line`, `--op-stepper-done-bg`, `--op-stepper-current-bg`, `--op-stepper-error-bg`.
Casos sandbox: `navigation` (avulso, com estados) e `form` (dentro do StepForm).
Fora do escopo: orientação vertical, etapas ramificadas.
