# Tematização

Tudo que é visual vem de uma custom property. Três camadas, todas em `@layer optikos`:

| Camada | Exemplo | Quem muda |
|---|---|---|
| Primitivos | `--op-blue-600` | quase ninguém (paleta bruta) |
| Semânticos | `--op-color-primary`, `--op-radius`, `--op-space-3`, `--op-font-size` | temas |
| De componente | `--op-button-bg`, `--op-grid-row-height` | temas e instâncias |

Cada componente usa o token próprio e cai no semântico: `background: var(--op-button-bg, var(--op-color-surface))`.

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

Temas incluídos: `light` (padrão, em `optikos.css`), `dark.css`, `compact.css` (densidade: controles e espaços menores). Combine: `data-op-theme="dark compact"`.

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

## Temas prontos (visual completo)

Além de `light` (padrão), `dark` e `compact` (densidade), há seis temas que trocam **cores, forma, densidade e tipografia** (não só a paleta), para o mesmo app parecer outro produto. Cada um é um arquivo em `optikos/themes/<nome>.css`; ative com `data-op-theme="<nome>"` (e combine com `compact`, se quiser).

| Tema | Como é |
|---|---|
| `corporate` | sóbrio e organizado, para back-office: azul aço sobre cinza frio, raios pequenos, filetes finos, plano, sidebar azul-marinho (`--op-navmenu-*`), controles de 2,375rem, linhas de 2,75rem, fonte de 15px; feito para sessões longas em grids e formulários |
| `brutal` | bordas pretas de 3px, raio 0, sombras duras deslocadas, amarelo forte, rótulos em caixa-alta; os botões "levantam" no hover e "afundam" ao clicar |
| `soft` | claro e arejado: raios grandes, botões em pílula, violeta pastel, sombras difusas, campos sem borda (fundo suave), linhas altas |
| `terminal` | verde fósforo sobre preto, fonte monoespaçada, raio 0, denso, foco com brilho, títulos com `>` |
| `brand` | luxo/joalheria, **claro e de uso diário**: champagne e marfim, texto ônix, ouro antigo, serifa de alto contraste, filetes finos, capitulares espaçadas, faixas de título em ônix com texto dourado, botão principal em folha de ouro. `data-op-theme="brand night"` dá a versão escura (ônix) |
| `editorial` | papel quente, fonte serifada, filetes de tinta em vez de caixas, campos só com linha embaixo, botões em versalete, vinho como cor de destaque |

Eles mostram até onde um tema vai com tokens e regras escopadas (`[data-op-theme~='x'] .op-button { … }`). Para temas assim use os tokens de componente (`--op-panel-header-bg`, `--op-grid-header-bg`, `--op-button-radius`...) antes de escrever regra; regra só para o que token não alcança (caixa-alta, sombra deslocada, campo sublinhado). Em popups (menu, janela, dropdown) o atributo `data-op-theme` está no próprio elemento flutuante, então prefira tokens a seletores descendentes.
No dev, a barra das sandboxes e o frame dos demos têm um seletor com todos eles (`?theme=brutal` também funciona).
