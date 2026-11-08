# Docs vivas e servidor MCP

Um ambiente à parte da sandbox (que é para quem **desenvolve** a lib): o site de documentação é para quem **usa** a lib.
Feito com o próprio Optikos, sem dependências novas.

## Subir

- kai: pasta **Docs → Docs site** (abre `http://localhost:5180/site/`); no terminal, `npm run site`.
- Conteúdo: página inicial por categoria, uma página por componente, guias (arquitetura, tematização, motion, catálogo), tokens e temas, e a página do MCP.
- `Ctrl+K` busca qualquer componente (é o `CommandPalette` da lib). O seletor do topo troca o tema do site inteiro.

## Página de um componente

1. **Exemplos ao vivo.** Cada exemplo mostra o componente funcionando e, embaixo, a config em JSON **editável**: *Apply* (ou Ctrl+Enter) recria o componente; *Reset* volta ao original; *Copy code* copia o `create({...})`.
   Coisas que flutuam (Window, Menu, Dropdown, Toast, MessageBox, CommandPalette, Widget) ganham um botão "Open".
2. **Ficha**: as seções da ficha (`docs/components/<nome>.md`): config, API, eventos, estados, teclado/ARIA, tokens.
3. Link para a página da categoria na sandbox.

## Fonte única

- Fichas: `docs/components/*.md`. Exemplos: `site/examples.json` (um array por componente; JSON puro).
- `scripts/docs-data.mjs` lê tudo e entrega para o site (`.dev/site.json`) e para o MCP.
- JSON não diz "um Store" nem "uma função": `{"$store": [linhas]}` vira `new Store({ data })` e `{"$tpl": "{name}"}` vira um `renderer`.
- Exemplo que não cabe em JSON (ex.: precisa de outro componente por referência) usa `code` + `demo` em vez de `config`.
- `site/examples.test.ts` renderiza **todo** exemplo; `scripts/site.test.mjs` exige exemplo para toda ficha. Componente novo = ficha + exemplo.

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
