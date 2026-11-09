# SecretField  (type: 'secretfield')
Propósito:     Campo para segredos (chave de API, token, senha de integração): quem **digita** pode ver o que digitou; um segredo **já salvo nunca é mostrado de novo**: para mudá-lo é preciso substituí-lo, depois de um aviso.
Anatomia:      Igual ao `TextField` (`op-textfield`) + `op-secret`: input `type=password`, botão **olho** (`__eye`, só ao digitar), e no estado salvo os botões **Substituir** (`__replace`) / **Manter o atual** (`__keep`) e a dica "há um valor salvo e ele não pode ser exibido".
Valor:         `getValue()`: `null` = não mexeu (manter o que está salvo), `'texto'` = valor novo, `''` = substituiu e deixou vazio (limpar). Só os dois últimos devem ser enviados ao servidor. `isStored()` diz se há segredo salvo; `isReplacing()` se o usuário está trocando.
Config:        (TextField) + `stored: false` (já existe um segredo salvo; `form.load({ apiKey: true })` também liga), `confirmReplace: true` (aviso modal antes de substituir),
               `replaceTitle`, `replaceText` (texto do aviso), `autoHide: true` (o olho volta a esconder ao sair do campo). `inputType` é sempre senha (o olho alterna para texto).
API:           `setStored(bool)`, `isStored()`, `isReplacing()`, `replace()` (abre o aviso; devolve Promise<boolean>), `keep()` (desiste da troca e volta ao estado salvo), `setRevealed(bool)`, `isRevealed()`, `getDisplayText()` (nunca revela: `••••••••` ou vazio).
Eventos:       `before-replace` (cancelável), `replace` (depois de confirmar), `keep`, `stored-change(bool)`, `change`.
Estados:       `is-stored` (somente leitura, máscara no lugar do valor, sem olho), `is-replacing`, `is-revealed`. `required` conta como atendido enquanto há segredo salvo e não mexido.
Fluxo:         Criar: digita (mascarado), olho mostra/oculta. Editar com segredo salvo: o campo mostra `••••••••` e não deixa ver nada; clicar no campo ou em **Substituir** abre o aviso ("o valor salvo não pode ser exibido e será descartado..."); confirmando, o campo esvazia e vira um campo de digitação normal (com olho) e aparece **Manter o atual**.
               `reset()` volta ao estado salvo. O texto nunca vai para `getDisplayText`, resumos de StepForm ou logs do Optikos.
Teclado/ARIA:  Olho: botão com `aria-pressed` e rótulo "Mostrar/Ocultar valor"; no estado salvo o input é `readonly` e descrito pela dica (`aria-describedby`); Enter/Espaço no input ou no botão Substituir abrem o aviso; o aviso é um `MessageBox` modal (foco preso, Esc cancela).
Tokens:        os do `TextField`; `--op-secret-mask-fg` (cor da máscara do estado salvo).
Casos sandbox: `form`: criar x editar, aviso de substituição, "manter o atual", `required`, carregar com `{ key: true }`.
Fora do escopo: copiar para a área de transferência, geração de segredos, medidor de força, mostrar os últimos 4 caracteres (o servidor decide o que devolver).
