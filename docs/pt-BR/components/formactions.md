# FormActions  (type: 'formactions')
Propósito:     A barra de ações do formulário: Cancelar (restaura) e Salvar (envia), um status "Alterações não salvas", e opcionalmente fixa no rodapé de um formulário longo ou só habilitada depois que algo mudou.
Anatomia:      `.op-formactions` > `.op-formactions__status` (uma região viva educada) + `.op-formactions__buttons` (botões extras, Cancelar, Salvar: `.op-button`s). `.is-sticky` a prende ao rodapé da área que rola.
Config:        (Component) + `submitText` (padrão "Salvar"), `cancelText` (padrão "Cancelar"; `false` esconde o Cancelar), `buttons` (configs de Button extras, antes do Cancelar), `sticky: false`, `requireChanges: false` (Salvar fica desabilitado até o formulário mudar), `status: true` (a linha "Alterações não salvas").
API:           `getForm()`, `setSubmitText(texto)`, `setCancelText(texto | false)`, `setSticky(bool)`. Ela encontra o seu Form subindo pelos pais.
Eventos:       `cancel` (cancelável: devolva `false` para manter as alterações), depois o formulário é restaurado.
Estados:       `is-dirty`, `is-sticky`.
Teclado/ARIA:  Salvar é um botão `type=submit` de verdade (Enter num campo também envia); a linha de status é `aria-live=polite`, então "Alterações não salvas" é anunciado uma vez quando aparece.
Tokens:        `--op-formactions-bg`, `--op-formactions-border`, `--op-formactions-padding`.
Casos sandbox: simples, `requireChanges`, fixa no rodapé de um formulário longo, um botão extra "Salvar rascunho", Cancelar perguntando antes (`cancel` devolvendo false depois de um confirm).
Fora do escopo: salvamento automático, um relógio "salvo há 2 minutos".
