# Escrita enxuta: classes, atalhos `ui` e enums

Três jeitos de escrever a mesma tela, do mais verboso ao mais enxuto. Todos produzem os mesmos componentes e se misturam à vontade.

```ts
// 1. declarativo (JSON-friendly: serve para config vinda de servidor)
{ type: 'textfield', name: 'email', label: 'Email', inputType: 'email', required: true }

// 2. classes (tipadas; o editor completa a config de cada componente)
new TextField({ name: 'email', label: 'Email', inputType: 'email', required: true })

// 3. atalhos `ui` (nome, rótulo e, se precisar, uma config no fim)
ui.email('email', 'Email', { required: true })
```

## `ui` (`import { ui } from 'optikos'` ou `'optikos/ui'`)

Devolvem instâncias reais, então valem em qualquer `items: [...]`. O último argumento é sempre uma config que sobrescreve ou acrescenta.

| Atalho | Faz |
|---|---|
| `ui.text/email/password/area/number/date/dateRange/secret/slider(name, label?, cfg?)` | o campo do mesmo nome (`email`/`password` fixam o `inputType`) |
| `ui.check(name, boxLabel?, cfg?)` | `Checkbox` |
| `ui.radio(name, label, options, cfg?)` · `ui.select` · `ui.combo` | campos de opções |
| `ui.suggest(name, label, query, cfg?)` · `ui.lookup(name, label, lookup, cfg?)` | busca por digitação / janela de pesquisa |
| `ui.button/primary/danger(text, handler?, cfg?)` | `Button` (o `handler` é o 2º argumento) |
| `ui.row(...items)` · `ui.col(...items)` · `ui.grid(colunas, ...items)` | contêineres `hbox`, `vbox`, `grid` |
| `ui.panel(title, items, cfg?)` · `ui.toolbar(...items)` · `ui.form(items, cfg?)` | `Panel`, `Toolbar` (aceita `'->'`, `'-'`), `Form` |

## Enums

Objetos constantes com tipo de mesmo nome. O valor é a própria string, então `Variant.Primary` e `'primary'` são intercambiáveis; o editor completa os dois.

`Variant`, `LabelPos`, `Direction`, `Region`, `Side`, `LayoutKind`, `Selection`, `ToastType`, `Op` (operadores de filtro), `ThemeName`.

```ts
ui.radio('kind', 'Type', ['person', 'company'], { direction: Direction.Horizontal })
create({ type: 'button', text: 'Delete', variant: Variant.Danger })
store.filter({ field: 'name', op: Op.Contains, value: 'ada' })
```

## Regras

- `ui` e os enums vivem em `src/ui/` e têm entrada própria (`optikos/ui`); **não** contam no orçamento do core.
- Um atalho só entra se o padrão é usado muito (campos, botões, contêineres); o que sobra continua em classe ou `create`.
- Componente novo com padrão de uso repetido ganha atalho aqui no mesmo commit da ficha.
