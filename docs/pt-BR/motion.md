# Motion (animação e micro-interações)

Um conjunto de utilitários, tokens e comportamentos de animação, **tudo configurável** e com um **interruptor global**. Os padrões vêm de 20 regras de motion design; com tudo ligado e sem mexer em nada, os números padrão são os das regras.

```ts
import { motion } from 'optikos';
motion.disable();                       // desliga tudo (as animações viram instantâneas)
motion.enable();
motion.set({ duration: { dropdown: 180 }, press: { scale: 0.95 } });   // muda só o que quiser
motion.reset();                         // volta aos padrões
motion.set({ ease: { out: 'cubic-bezier(.3,1.6,.3,1)' } });           // recusado: tem "bounce" (regra 13)
```

`motion.isOn()` é `enabled` **e** (se `respectReducedMotion`, padrão `true`) o usuário não pediu `prefers-reduced-motion`. Desligado, os componentes não animam e os tokens CSS ficam neutros (`--op-motion-press-scale: 1`...).
Sem `Element.animate` (testes, navegadores antigos) tudo é instantâneo: nenhuma lógica depende da animação terminar.

## Configuração (padrões)

| Chave | Padrão | Regra |
|---|---|---|
| `enabled` / `respectReducedMotion` | `true` / `true` | interruptor global |
| `ease.out` / `ease.in` / `ease.inOut` | `cubic-bezier(0,0,.2,1)` / `cubic-bezier(.4,0,1,1)` / `cubic-bezier(.4,0,.2,1)` | 1, 9 |
| `duration.dropdown` + `dropdownRange` | `200` ms, faixa `[150, 250]` (o valor é **limitado** a ela) | 2 |
| `stagger.step` / `stagger.max` | `30` ms / `12` itens (depois não escalona) | 3, 6 |
| `press.scale` | `0.97` | 4 |
| `stretch.amount` | `0.12` (12 %) | 5 |
| `arc.bend` | `0.25` (curvatura = fração da distância) | 7 |
| `duration.pulse` | `450` ms | 8 |
| `popover.scale` / `duration.popover` / `duration.modal` | `0.95` / `200` / `240` | 10 |
| `originFromTrigger` | `true` | 11, 12 |
| `allowBounce` | `false` (curvas com overshoot são recusadas) | 13 |
| `exitRatio` | `0.8` (a saída dura 20 % menos) | 15 |
| `duration.swap` / `blur` | `220` ms / `4` px | 16, 18 |
| `duration.reveal` | `350` ms | 17 |
| `rubber.resistance` / `rubber.settle` | `0.55` / `320` ms | 19 |
| `duration.move` | `450` ms | 7, 9, 20 |

Tokens CSS gerados na raiz: `--op-motion-ease-out/in/in-out`, `--op-motion-press-scale`, `--op-motion-press-duration`, `--op-motion-popover-scale`, `--op-motion-dropdown-duration`, `--op-motion-exit-ratio`, `--op-motion-stagger-step`, `--op-motion-blur`.

Orçamento: o módulo (`optikos/motion`) pesa ~4 kB gzip; os componentes que animam (Dropdown/Menu/Window/Toast/DataView/Button) importam só a parte pequena (`popIn`, `popOut`, `stagger`, `pulse`, `enter`) e a configuração, ~2 kB. `rubberScroll`, `dragKnob`, `moveArc`, `swap`, `reveal`, `wipeColor` e `layoutId` só entram no bundle de quem os usa.
Testes: o setup do vitest chama `motion.disable()`; os testes de motion ligam e simulam `Element.animate`.

## As 20 regras → o que existe

| # | Regra | Onde |
|---|---|---|
| 1 | Entradas com ease-out | `ease.out` é a curva de toda entrada (`enter()`, `popIn`, `stagger`) |
| 2 | Dropdown 150–250 ms | `Dropdown`, `Menu`, `Select`... usam `popIn`; a duração é limitada a `dropdownRange` |
| 3 | Stagger de 30 ms em listas | `stagger(els)`; `Menu` e `DataView` já escalonam (até `stagger.max`) |
| 4 | Escala 0.97 ao pressionar | CSS: `.op-button`, `.op-dataview__item` e qualquer `[data-op-press]` |
| 5 | Knob estica 12 % | `dragKnob(knob, track)` |
| 6 | Stagger de detalhes | `staggerDetails(root, ['.title', '.text', '.chip'])` |
| 7 | Movimento em arco | `moveArc(el, destino)` |
| 8 | Pulso de sucesso | `pulse(el)`; `Button.pulse()`; o toast `success` pulsa |
| 9 | Ease-in-out ao cruzar a tela | `ease.inOut` em `moveArc`, `layoutId` |
| 10 | Popover nasce em 0.95 | `popIn` (`popover.scale`) em Dropdown, Window e MessageBox |
| 11 | Entra a partir do gatilho | `transform-origin` calculado no gatilho (`originFromTrigger`) |
| 12 | Sai em direção ao gatilho | `popOut` com a mesma origem |
| 13 | Sem bounce | `motion.set` recusa curvas com overshoot (`allowBounce: false`) |
| 14 | Sem tween no "hold" | CSS: enquanto pressionado, só `transform` faz transição |
| 15 | Saída 20 % mais curta | `exitRatio` em `popOut`, fechar de Window |
| 16 | Sobreposição de estados | `swap(host, novo)`: antigo e novo coexistem durante a transição |
| 17 | Máscaras | `reveal(el)` (clip-path) e `wipeColor(el, cor)` |
| 18 | Crossfade + blur | `swap(host, novoNó)` (ícones: `swap(el, iconEl('heart'))`) |
| 19 | Rubber band só nos limites | `rubberScroll(scroller)`, `rubberBand(x, limite)` |
| 20 | layoutId | `layoutId.snapshot(id, el)` + `layoutId.mount(id, novoEl)` (FLIP) |

Demo: `demos/motion` (um cartão por regra, painel de configuração ao vivo e o interruptor global).
