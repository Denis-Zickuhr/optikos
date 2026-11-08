# AGENTS.md

Guia para agentes (IA ou humanos) que trabalham no Optikos. Leia `PHILOSOPHY.md` antes.

## Regras do projeto

- **Autoria:** o dono do projeto é sempre o único autor dos commits. Não adicione
  `Co-Authored-By` nem nenhuma assinatura de IA. Não faça commit nem push sem pedido explícito.
- **Zero dependências em runtime.** Ferramentas de dev (TypeScript, bundler, testes) são
  permitidas; nada entra em `dependencies` do `package.json`.
- **Código enxuto.** Sem over-engineering, sem camadas "para o futuro" e sem config de
  configuração. Se a solução precisa de explicação longa, simplifique.
- **Idioma:** código, APIs e identificadores em inglês. Docs de planejamento em português.
- **Comandos de dev** ficam no `kai.yml` (ferramenta [kai](https://github.com/Denis-Zickuhr/kai)),
  espelhados em `package.json` scripts.

## Estrutura

```
src/
  core/          Component, Container, Field, registry, eventos, i18n, foco, posição, virtualização
  layout/        layouts (fit, hbox, vbox, border, grid, card)
  data/          Store, Model, Proxy, formatos (para grid, combo, dataview)
  components/
    <categoria>/<nome>/
      <nome>.ts      implementação
      <nome>.css     estilos (só tokens, nada fixo)
      <nome>.test.ts testes
  bind/          optikos/bind: signal, computed, effect, bind
  motion/        optikos/motion: animações e configuração global de motion
  ui/            optikos/ui: atalhos ui.* e enums
  themes/        tokens base, temas prontos e defineTheme
  index.ts       exports públicos (gerado por `npm run gen`)
sandbox/         uma página por categoria de componente
demos/           apps de demonstração completos (só API pública)
dev/             índice e moldura de navegação do servidor de dev
site/            docs vivas (`npm run site`) e exemplos (`examples.json`)
scripts/         build, dev, site, servidor MCP, release, geradores
docs/            catálogo, arquitetura, guias e fichas (`docs/components/<nome>.md`)
docs/internal/   planejamento (PLAN.md) e registro de rodadas (fixes.md)
```

## Convenções

- Classe CSS: `op-<componente>` e partes `op-<componente>__<parte>`, estados `is-<estado>`.
- Tokens CSS: `--op-<escopo>-<propriedade>` (ex.: `--op-color-primary`, `--op-button-radius`).
- Estilos dentro de `@layer optikos` para que o CSS do usuário sempre vença sem `!important`.
- Cada componente se registra com um `type` (ex.: `'textfield'`), usado na declaração.
- Eventos públicos em kebab-case (`change`, `select`, `before-close`).
- Todo config público mutável tem setter (`text` → `setText`). O setter atualiza só a parte
  do DOM afetada. Componentes nunca dependem de signals; o binding (`optikos/bind`) fica por cima.
- Tudo que um componente registra (listeners, timers, effects) é liberado no `destroy`.

## Criando um componente

1. Escreva a ficha em `docs/components/<nome>.md` (modelo em `docs/components/_modelo.md`).
2. Implemente estendendo `Component` (ou `Field`/`Container`), registre o `type`.
3. CSS só com tokens; declare os tokens próprios do componente no topo do arquivo.
4. Adicione casos na sandbox da categoria.
5. Escreva testes de comportamento (API, eventos, teclado).
6. Exporte em `src/index.ts` e confira o tamanho no build.

## Checklist antes de entregar

- [ ] Typecheck e testes passando
- [ ] Sem dependência nova em runtime
- [ ] Funciona com teclado e tem ARIA correto
- [ ] Visual 100% por tokens (testado com pelo menos 2 temas)
- [ ] Caso na sandbox
