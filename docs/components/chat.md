# Chat  (type: 'chat')
Propósito:     Conversa dinâmica: lista de mensagens que cresce, campo de envio, indicador de "digitando" e resposta em streaming. Serve para um app de mensagens ou para um modo de IA dentro do app.
Anatomia:      `.op-chat` > `__log[role=log][aria-live=polite]` (rolável) > `__day` (separador de dia) e `__msg` (`is-me`/`is-them`, `is-first`/`is-last` do grupo) > `__author` (só no 1º do grupo, conversas em grupo),
               `__bubble` (texto formatado, `__reply` citando outra mensagem) e `__meta` (hora + tiques `__status`); `__typing` (três pontos); `__suggestions` (chips de prompt) e `__composer` (textarea + botão enviar).
Config:        `messages: ChatMessage[]`, `me: string` (id de quem usa; define o lado da bolha), `users: Record<id, { name, color? }>` (nomes; `showAuthors: false` esconde),
               `placeholder`, `suggestions: string[]` (chips acima do campo; clicar envia), `readonly: false`, `sendOnEnter: true` (Shift+Enter quebra linha), `maxLength`,
               `renderer?: (msg) => string | Node` (conteúdo customizado da bolha; o padrão é formatação mínima segura: `**negrito**`, `*itálico*`, `` `código` ``, quebras de linha, links não clicáveis).
ChatMessage:   `{ id, from: string, text, time: number | Date | string, status?: 'sending'|'sent'|'delivered'|'read'|'error', replyTo?: id, meta?: unknown }`.
API:           `addMessage(msg)` (devolve a mensagem; id automático se faltar), `setMessages(list)`, `updateMessage(id, patch)`, `appendToMessage(id, text)` (streaming: só o nó da bolha muda),
               `removeMessage(id)`, `getMessages()`, `setTyping(who | boolean)` ("fulano está digitando…" ou só os pontos), `setSuggestions(list)`, `send(text)` (o mesmo caminho do botão),
               `scrollToBottom()`, `setBusy(bool)` (desabilita o envio, ex.: enquanto a IA responde), `focus()`, `setReadonly`, `setPlaceholder`.
Eventos:       `before-send(text)` (cancelável), `send(text, message)`; a mensagem já aparece (status `sending`) e o app a atualiza com `updateMessage`. `suggestion(text)`, `message-click(msg)`.
Estados:       `is-busy`, `is-empty` (texto "sem mensagens"), rolagem: acompanha o fim só se o usuário já estava perto do fim (senão não puxa a tela).
Teclado/ARIA:  Enter envia, Shift+Enter quebra linha, Esc no campo não faz nada; o log é `role=log` com `aria-live=polite` (cada mensagem nova é anunciada); o botão tem `aria-label`; chips de sugestão são botões.
Tokens:        `--op-chat-bg`, `--op-chat-bubble-me-bg/fg`, `--op-chat-bubble-them-bg/fg`, `--op-chat-bubble-radius`, `--op-chat-gap`, `--op-chat-max-width` (largura da bolha), `--op-chat-day-bg`, `--op-chat-read-fg`.
Casos sandbox: conversa estática com status e dias, envio com resposta simulada (digitando), streaming de resposta de "IA", grupo com autores, sugestões, somente leitura.
Fora do escopo: anexos/áudio/emoji, markdown completo (listas, tabelas, blocos de código), reações, edição, busca na conversa, virtualização (milhares de mensagens: pagine/limite no app).
