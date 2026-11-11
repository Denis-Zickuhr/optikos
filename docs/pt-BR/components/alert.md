# Alert  (type: 'alert')
Propósito:      Uma mensagem na página, não sobre ela: erro de formulário ou de login, "nada por aqui ainda", um aviso.
Anatomia:       `op-alert` (`op-alert--info|success|warning|danger`) > `op-alert__icon`, `op-alert__body` (`__title`, `__text`), `op-alert__close`.
Config:         `tone: 'info'|'success'|'warning'|'danger'` (info), `title`, `text`, `icon` (pelo tom; `false` tira), `closable`, `role: 'alert'|'status'|'note'` (`alert` para warning e danger, `status` para os demais).
API:            `setTone`, `setTitle`, `setText`, `setIcon`, `close()` (esconde; `show()` traz de volta).
Eventos:        `close` (o botão ou `close()`).
Estados:        Partes vazias (sem título, texto ou ícone) não ocupam espaço.
Teclado/ARIA:   `role=alert` é lido na hora em que aparece; `status` com educação. O ícone é decorativo; o botão de fechar é um botão normal chamado "Fechar". O tom nunca é só cor: o ícone e o texto o carregam.
Tokens:         `--op-alert-bg`, `--op-alert-fg`, `--op-alert-radius`, `--op-alert-accent`, `--op-alert-icon-offset`; as cores do tom vêm do tema (`--op-color-info|success|warning|danger` e seus `-soft`).
Casos sandbox:  `feedback`: os quatro tons, com título, fechável, e usado como estado vazio.
Fora do escopo: Sumir sozinho (isso é o `toast`), ações dentro dele (ponha um Button ao lado), posição flutuante.
