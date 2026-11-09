# Modelo de ficha de componente

Copie este arquivo para `<nome>.md`. Toda seção é obrigatória (escreva "—" se não se aplica).
A ficha vem **antes** do código; se a implementação divergir, atualize a ficha no mesmo commit.

```md
# <Nome>  (type: '<type>')
Propósito:     uma frase
Anatomia:      partes do DOM e classes (op-x, op-x__part)
Config:        props + defaults
API:           métodos públicos (todo config mutável tem setter)
Eventos:       nome, payload, se é cancelável (before-*)
Estados:       disabled, focus, invalid, loading...
Teclado/ARIA:  teclas e roles
Tokens:        --op-<x>-* próprios
Casos sandbox: lista do que demonstrar
Fora do escopo: o que não vamos fazer
```

Convenções que valem para toda ficha (não repetir): config comum de `Component` (`id`, `cls`, `style`,
`hidden`, `width`, `height`, `flex`, `tooltip`, `theme`, `loading`, `stableSize`, `listeners`, `renderTo`), métodos comuns
(`show/hide`, `setDisabled`, `focus`, `destroy`, `on/off/once/emit`) e o evento `destroy`.
