# Filosofia do Optikos

Optikos é uma biblioteca para desenhar interfaces web declarando telas, campos, grids e
janelas como objetos de configuração. É construída só com HTML, CSS e JS/TS puros, sem
dependências em runtime, e traz os componentes de um app de negócio completo.

## Pilares

| Pilar | O que significa na prática |
|---|---|
| **Rápido** | Renderiza só o necessário. Atualiza o DOM de forma pontual, sem virtual DOM. Listas grandes usam virtualização. |
| **Leve** | Nenhuma dependência em runtime. Cada componente pode ser importado sozinho (tree-shaking). O tamanho de cada pacote é medido. |
| **Simples** | Uma forma óbvia de fazer cada coisa. A API é pequena e o código é legível. Nada de mágica escondida. |
| **Completo** | Muitos componentes prontos (campos, suggest, grid, tree, modal, tabs, menus...), suficientes para montar um app inteiro sem buscar outras libs. |
| **Puro** | Usa a plataforma: DOM, CSS custom properties, eventos nativos e ES modules. Sem framework por baixo e sem JSX obrigatório. |
| **Expansivo** | O usuário cria campos, componentes, layouts, temas e bundles próprios com as mesmas ferramentas que os componentes padrão usam. |

## Princípios

1. **Declarativo primeiro.** Uma tela é um objeto de configuração (`{ type: 'form', items: [...] }`).
   A API imperativa existe, mas a declaração é o caminho principal.
2. **Componente padrão = componente custom.** Nenhum componente nativo usa API interna
   que o usuário não tenha. Se o núcleo precisa de algo, o usuário também pode usar.
3. **Abstrações boas, poucas.** Antes de criar uma abstração, ela precisa servir a três
   componentes reais. Duplicação pequena é melhor que abstração errada.
4. **Tema não é detalhe.** Toda cor, espaçamento, raio, fonte e sombra vem de um token.
   O visual pode ser trocado globalmente ou por componente, sem tocar no JS.
5. **CSS faz o que o CSS sabe fazer.** Layout, estados visuais e animações ficam no CSS.
   O JS cuida de comportamento e de dados.
6. **Acessível por padrão.** Teclado, foco e ARIA fazem parte da definição do componente,
   não são um extra.
7. **Pense antes de codar.** Todo componente começa por uma ficha (propósito, API, eventos,
   anatomia, tokens, teclado) antes da implementação.
8. **Medido, não suposto.** Tamanho e desempenho têm metas e são verificados no build.

## O que o Optikos não é

- Não é um framework reativo (React/Vue/Solid). Não existe ciclo de render global.
- Não é um kit de CSS utilitário.
- Não esconde o DOM: o elemento de cada componente fica acessível (`cmp.el`).
