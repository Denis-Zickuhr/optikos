# Relatório da noite (2026-11-09)

Branch `noite/2026-11-09`, 15 commits, sem push, sem tag. A noite parou no meio da fase C porque o limite de uso acabou.

## Itens

| Item | Situação | Commit |
|---|---|---|
| A1 Folga de tamanho (mensagens por componente, `addMessages`) | feito | e6a8cc4 |
| A2 Testes em navegador real (Vitest + Playwright) | feito, verificado localmente | 222f2df |
| A3 Acessibilidade automática (axe, todos os temas) | feito | d72edc8 |
| A4 Benchmark (`npm run bench`) | feito; achou e corrigiu sort 13× mais lento | 4b0ca08 |
| A5 `Grid<T>` genérico | feito | a0d62f4 |
| A6 Pequenos consertos (+ smoke de demos) | feito | 5ef5a8e, 2792978 |
| D Docs bilíngues + seletor de idioma | feito | f7541a1 |
| E Site como vitrine (home, receitas, demos no Pages) | feito | c8c850b |
| B1 Plugins do Grid + `cellEditing()` | feito | aba767f |
| B2 `defineBundle` | decidido não fazer (decisão 55) | aba767f |
| C Tree, Toggle, CheckboxGroup, Badge, Chip | feito | a415700, 2cef3c7, 8ca77c7, 717d792 |
| C Alert, ProgressBar, Drawer, Popover/ContextMenu, Accordion, Splitter, TagField, Time/DateTime, Mask/Currency, FileField, SplitButton, Link | não feito (limite de uso) | — |

## Decisões novas (`docs/architecture.md`)

- 47: cada componente traz as próprias mensagens (`addMessages`); medição antes/depois.
- 48: testes em navegador real fora do `check`, num job do CI.
- 49: axe em todo exemplo × 10 temas; o que foi corrigido.
- 50: benchmark no navegador; collator único.
- 51: `Grid<T>` com padrão `any`.
- 52: docs públicas em inglês + `docs/pt-BR/`.
- 53: o site é a vitrine e é feito com a lib (receitas = arquivos reais, demos publicadas).
- 54: plugins do Grid; `cellEditing` como entrada própria.
- 55: sem `defineBundle` por enquanto (princípio 3).
- 56: token `--op-color-primary-text`.

## Limites de tamanho

- core 11 → 9 kB (medido 10,27 → 8,13); data 5,25 → 4,25 kB (5,02 → 3,85).
- +1 kB em grid, searchgrid, filterbuilder, viewmanager, lookupfield, stepform, widget, breadcrumb, e daterangefield +0,5 kB. Motivo: as mensagens passaram do runtime mínimo (−1,18 kB) para cada componente. O total permitido de cada um ficou **menor** que antes (decisões 47 e 49).
- Pacote completo: 63,79 kB gzip de JS, 15,04 kB de CSS.

## Achados que viraram correção na lib

- O grid punha `role=grid` numa raiz que continha a paginação; agora fica no `.op-grid__table` interno. É uma mudança visível: está no CHANGELOG em Changed.
- Button em loading ficava sem nome; o Stepper ficava sem nome no celular; o DateField tinha um ARIA inválido; o Dropdown ficava sem nome.
- `ariaLabel` de um campo ia para o invólucro, não para o `<input>`.
- Contraste em `light`, `dark`, `soft`, `brutal`, `brand` e `brand night`.
- O sort de texto levava 5,4 s com 100 mil registros; caiu para 0,41 s.
- `ui.grid(2)` perdia o colapso responsivo.
- `defineTheme` não definia `--op-radius`; agora `radius: '0.75rem'` faz isso.

## Verificação

- `npm run check`: 495 testes no happy-dom, sem estouro de orçamento.
- `npm run test:browser`: cerca de 600 testes no Chromium (axe incluído). Neste WSL roda com bibliotecas extraídas em `~/.cache/optikos-chromium-libs` (`LD_LIBRARY_PATH`); no CI, o job `browser` instala tudo.
- O site estático foi testado sob `/optikos/`, com screenshots (desktop, celular via Playwright, claro e escuro). O axe passou em todas as páginas do site.

## Dúvidas para o dono

1. A mudança do `role=grid` (Changed) quebra quem lia `grid.el.getAttribute('aria-…')`. Isso justifica uma 0.2.0? Eu publicaria tudo como 0.2.0.
2. O tema `dark` agora usa blue-400 como primário (contraste). Está ok visualmente?
3. A demo `chat` (Prosa) é só em português. Vale torná-la bilíngue para o site?
4. Migrar tabs, navmenu e listbox para `--op-color-primary-text` (decisão 56)?
