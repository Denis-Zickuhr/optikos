# Viewport  (type: 'viewport')
Propósito:     Container raiz que ocupa a janela inteira (layout padrão `fit`).
Anatomia:      `<div class="op-viewport">` (`position:fixed; inset:0`), montado em `document.body`.
Config:        (Container) + `renderTo` (body). Só pode existir um por documento (o segundo lança erro).
API:           (Container).
Teclado/ARIA:  sem semântica; filhos definem regiões (`main`, `nav`).
Tokens:        `--op-viewport-bg`, `--op-viewport-fg`.
Responsivo:    O que adapta é o *layout* do container (medido no próprio container, não na janela): `border` com drawers, `grid` e `hbox` que empilham. Ver `container.md`. O evento `narrow-change(bool)` avisa o app; o container ganha a classe `is-narrow`.
Casos sandbox: border layout com sidebar/topbar, aninhamento com Tabs.
Fora do escopo: múltiplos viewports, iframes.
