# Tematização

Tudo que é visual vem de uma custom property. Três camadas, todas em `@layer optikos`:

| Camada | Exemplo | Quem muda |
|---|---|---|
| Primitivos | `--op-blue-600` | quase ninguém (paleta bruta) |
| Semânticos | `--op-color-primary`, `--op-radius`, `--op-space-3`, `--op-font-size` | temas |
| De componente | `--op-button-bg`, `--op-grid-row-height` | temas e instâncias |

Cada componente usa o token próprio e cai no semântico: `background: var(--op-button-bg, var(--op-color-surface))`.

`--op-color-primary-text` é a cor primária **como texto** (chips selecionados, o badge primary...). Não vem definida por padrão (os componentes caem em `--op-color-primary`); um tema cujo primário só funciona como preenchimento a define (um primário amarelo ou dourado, por exemplo, usa a cor do texto ou um tom mais fundo).

## 1. Global, por escopo e por componente

```html
<link rel="stylesheet" href="optikos/optikos.css" />
<link rel="stylesheet" href="optikos/themes/dark.css" />     <!-- opcional -->
<html data-op-theme="dark compact">                          <!-- lista: combina temas -->
<section data-op-theme="light">…</section>                   <!-- escopo: só esta árvore -->
```

```ts
create({ type: 'button', theme: { radius: '0', primaryBg: '#16a34a' } }); // --op-button-radius, --op-button-primary-bg (só esta instância)
```

Temas incluídos: `light` (padrão, em `optikos.css`), `dark.css` e `compact.css` (densidade: controles e espaços menores). Combine: `data-op-theme="dark compact"`.

O visual padrão é sóbrio e feito para back-office: azul aço sobre cinza frio, raios pequenos, filetes finos, superfícies
planas, sidebar azul-marinho (`--op-navmenu-*`), controles de 2,375rem, linhas de 2,75rem e fonte de 15px, para sessões
longas em grids e formulários. O `dark` é o mesmo visual à noite: superfícies em ardósia escura, sidebar mais escura, a
mesma forma e densidade.

Janelas, menus, dropdowns e toasts ficam em `body > .op-layer`; eles copiam o `data-op-theme` do elemento que os abriu, então um escopo escuro continua escuro nos seus popups.

## 2. Tema em CSS (zero JS)

```css
@layer optikos {
  [data-op-theme~='ocean'] { --op-color-primary: #0e7490; --op-radius: 0.125rem; }
}
```

Veja `demos/customization/ocean.css`. CSS **fora** de `@layer` vence o da biblioteca sem `!important`.

## 3. Tema proprietário (TS)

```ts
import { defineTheme, setTheme } from 'optikos';

const brand = defineTheme({
  color: { primary: '#7c3aed', primarySoft: '#f5f3ff' },   // --op-color-primary, --op-color-primary-soft
  button: { radius: '62.5rem', fontWeight: 700 },          // --op-button-radius, --op-button-font-weight
}, 'brand');

brand.apply();         // injeta o CSS e ativa em <html> (mantém outros temas: "dark brand")
brand.inject();        // só injeta (para oferecer num seletor); depois setTheme('brand')
setTheme('dark brand'); // troca os temas de qualquer elemento: setTheme(names, el)
```

Chaves camelCase viram kebab-case. Números saem sem unidade (`radius: 0`); escreva unidades como string (`'4px'`).
Para gerar o `.css` no build: `npm run theme -- meu-tema.ts meu-tema.css` (o arquivo faz `export default defineTheme(...)`), ou o comando kai **Theme to CSS**.

## Densidade

`--op-control-height`, `--op-control-padding-x`, `--op-row-height` e a escala `--op-space-*` definem a densidade; o tema `compact` só os redefine.

## Regras para quem escreve componentes

- CSS só com tokens. Valores literais vão num bloco `:root { --op-x-size: 1.5rem }` no topo do arquivo; o teste `themes/css.test.ts` reprova cor/tamanho solto.
- Tudo dentro de `@layer optikos`.
- Declare tokens que dependem do tema no ponto de uso (`var(--op-x, var(--op-color-…))`), nunca num `:root` com `var()` (não reavalia dentro de `data-op-theme`).
- Texto precisa manter contraste de 4,5:1 em todo tema: o teste de navegador `site/a11y.browser.test.ts` roda o axe em todo exemplo, em todo tema.

## Indo além: um visual completo

Um tema pode trocar **cores, forma, densidade e tipografia**, não só a paleta, para o mesmo app parecer outro produto:
defina primeiro os tokens semânticos e de componente (`--op-panel-header-bg`, `--op-grid-header-bg`, `--op-button-radius`...)
e escreva regras escopadas (`[data-op-theme~='x'] .op-button { … }`) só para o que token não alcança (caixa-alta, sombra
deslocada, campo sublinhado). Em popups (menu, janela, dropdown) o atributo `data-op-theme` está no próprio elemento
flutuante, então prefira tokens a seletores descendentes.
