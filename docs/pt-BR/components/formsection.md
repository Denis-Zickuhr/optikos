# FormSection  (type: 'formsection')
Propósito:     Uma parte com título de um formulário longo no estilo "página de configurações": o título e uma descrição numa coluna à esquerda, os campos à direita; empilhado (título em cima) quando a seção é estreita.
Anatomia:      `<section class="op-formsection" aria-labelledby>` > `.op-formsection__aside` (`h3.__title`, `p.__desc`) + `.op-formsection__body` (itens). A troca para lado a lado é uma container query na largura da própria seção, não da janela.
Config:        (Container) + `title`, `description`, `aside: true` (`false` = sempre empilhado), `columns` (uma grade responsiva para os campos; os itens aceitam `colspan`, um número ou `'full'`), `divider: true` (um filete entre seções seguidas). Layout padrão `vbox`.
API:           `setTitle(texto)`, `setDescription(texto)`, `setAside(bool)`, + Container (`add`, `remove`, `items`).
Eventos:       —
Estados:       `op-formsection--stacked` (com `aside: false`).
Teclado/ARIA:  `<section>` nomeada pelo título (`aria-labelledby`) e descrita pela descrição (`aria-describedby`): uma região sem marco que leitores de tela anunciam ao entrar nos campos. Sem teclas próprias.
Tokens:        `--op-formsection-aside-width` (a coluna da esquerda), `--op-formsection-gap`, `--op-formsection-divider`. Fica lado a lado a partir de 40rem da própria largura (uma container query: o ponto de quebra não pode ser um token).
Casos sandbox: uma página de configurações com três seções (perfil, notificações, zona de perigo), `aside: false`, `columns: 2` com `colspan: 'full'`, dentro de um Form com `labelWidth`.
Fora do escopo: navegação entre seções (um sumário), títulos de seção fixos ao rolar, recolher (use um FieldSet recolhível).
