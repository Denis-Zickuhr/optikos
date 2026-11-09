# Docs vivas e servidor MCP

Um ambiente à parte da sandbox (que é para quem **desenvolve** a lib): o site de documentação é para quem **usa** a lib.
Feito com o próprio Optikos, sem dependências novas.

## Subir

- kai: pasta **Docs → Docs site** (abre `http://localhost:5180/site/`); no terminal, `npm run site`.
- Conteúdo: página inicial por categoria, uma página por componente, guias (arquitetura, tematização, motion, catálogo), tokens e temas, e a página do MCP.
- `Ctrl+K` busca qualquer componente (é o `CommandPalette` da lib). O seletor do topo troca o tema do site inteiro; o site
  oferece só os temas publicados (`light` e `dark`, `PUBLIC_THEMES` em `dev/themes.ts`).

## Versão publicada (GitHub Pages)

`npm run site:build` grava o site estático em `site-dist/` (um `index.html`, `main.js`, `site.json`, `optikos.css` e os
temas, tudo com caminhos relativos, então funciona em `https://denis-zickuhr.github.io/optikos/`). O workflow Release
publica essa pasta a cada tag `v*` (ou ao rodá-lo à mão em Actions). No site estático, os links para sandboxes e demos
apontam para o código no GitHub, porque elas só existem no servidor de dev.

## O que o site tem

- **Início** (vitrine): proposta, `npm i optikos` copiável, um formulário de verdade no hero, números reais medidos no build (kB do núcleo, componentes, temas, tokens), pilares, troca de tema que repinta a página inteira, "config → tela" lado a lado, receitas e demos.
- **Componentes**: índice por categoria e uma página por componente (abaixo).
- **Receitas** (`site/recipes/*.ts`): telas pequenas e completas. Cada arquivo exporta uma função que monta a tela num host e devolve a limpeza; o site roda essa função e mostra **o próprio arquivo** como código (o `site.json` leva o texto). Metadados bilíngues em `site/recipes/index.ts`; teste em `site/recipes/recipes.test.ts`.
- **Demos**: galeria com prévia ao vivo (iframe reduzido) de cada app de `demos/`. No build estático as demos são publicadas em `site-dist/demos/<nome>/` (sem a moldura de dev, caminhos relativos, chunks partilhados com o site); uma demo que usa um tema só de dev (`dev/themes/`) leva a própria cópia do CSS na sua pasta.
- **Guias** (Começar, Tematização, ui, Motion, Catálogo, Desempenho, Arquitetura), **Tokens e temas** (amostras com o valor vivo do tema atual) e **Servidor MCP**.
- Busca Ctrl+K: páginas, componentes, receitas, guias, demos e tokens.

## Página de um componente

1. **Exemplos ao vivo**, cada um com as abas *Resultado* e *Código*: a config em JSON é **editável**; *Aplicar* (ou Ctrl+Enter) recria o componente e volta ao resultado; *Restaurar* volta ao original; *Copiar código* copia o `create({...})`. Um índice "Nesta página" acompanha ao lado, e o tamanho (kB gzip) do componente aparece no topo.
   Coisas que flutuam (Window, Menu, Dropdown, Toast, MessageBox, CommandPalette, Widget) ganham um botão "Open".
2. **Ficha**, em abas: Uso (config, API, eventos, estados), Anatomia e tokens, Acessibilidade, Escopo.
3. Link para a página da categoria na sandbox.

## Fonte única

- Fichas: `docs/components/*.md` (inglês) e `docs/pt-BR/components/*.md` (português). Guias: `docs/<guia>.md` e `docs/pt-BR/<guia>.md`; `architecture.md` só em português.
- Exemplos: `site/examples.json` (um array por componente; JSON puro; `title`/`description` como `{ "en": …, "pt-BR": … }`).
- Idioma: seletor no topo (English/Português), lembrado no navegador; `?lang=pt-BR` força; sem escolha, segue o idioma do navegador. Trocar recarrega a página e chama `setLocale`, então os componentes dos exemplos também mudam de língua. Textos do próprio site em `site/i18n.ts` (teste exige as mesmas chaves nas duas línguas).
- `scripts/docs-data.mjs` lê tudo e entrega para o site (`.dev/site.json`) e para o MCP.
- JSON não diz "um Store" nem "uma função": `{"$store": [linhas]}` vira `new Store({ data })` e `{"$tpl": "{name}"}` vira um `renderer`.
- Exemplo que não cabe em JSON (ex.: precisa de outro componente por referência) usa `code` + `demo` em vez de `config`.
- `site/examples.test.ts` renderiza **todo** exemplo; `scripts/site.test.mjs` exige exemplo para toda ficha, as duas línguas em toda ficha (com as mesmas seções), em todo guia e em todo título de exemplo. Componente novo = ficha (en + pt-BR) + exemplo.
- O MCP aceita `lang` (`en` padrão, ou `pt-BR`) em `list_components`, `get_component`, `search_docs` e `get_guide`.

## Servidor MCP

`npm run mcp` (kai: **Docs → MCP server**), stdio, sem dependências. O `.mcp.json` da raiz já registra para o Claude Code; em outro cliente use o trecho de **Docs → MCP config**.

| Ferramenta | Devolve |
|---|---|
| `list_components` | nome, type, categoria e propósito de cada componente |
| `get_component` | a ficha completa de um componente |
| `get_examples` | as configs dos exemplos (as mesmas do site) |
| `search_docs` | busca em fichas e guias |
| `get_guide` | architecture, theming, motion ou catalog |
| `get_tokens` | tokens `--op-*` com valores, filtráveis por prefixo |
| `list_themes` | temas prontos |
