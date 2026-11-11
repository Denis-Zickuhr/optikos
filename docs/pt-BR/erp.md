# Receitas para back-office

O que uma tela de cadastro, um ERP ou um dashboard precisa, com a peça da Optikos para cada caso. Todo trecho roda; os mesmos
casos estão nos exemplos vivos do site (componentes `form`, `numberfield`, `chart`, `stat`, `timeline`...).

## Permissões

Um resolvedor para o app, uma `permission` em qualquer coisa que dependa dele.

```ts
import { setPermissionResolver, setPermissionMode } from 'optikos';

setPermissionResolver((p) => user.permissions.includes(p));
setPermissionMode('hide'); // ou 'disable'; o `permissionMode` do próprio componente vence

create({ type: 'button', text: 'Novo lote', permission: 'sale.lote.criar' });
create({ type: 'grid', columns, rowActions: [{ text: 'Excluir', permission: 'sale.lote.excluir', handler }] });
create({ type: 'navmenu', items: [{ id: 'lotes', text: 'Lotes', permission: 'sale.lote.ver' }] });
```

`permission` vale em qualquer componente (some, ou fica desabilitado) e em itens de menu, itens do `NavMenu`, comandos da
paleta, colunas da grid, ações de linha e ações em lote. Um componente escondido não volta com `show()`. O resolvedor é lido
quando o componente renderiza: defina-o antes de montar a tela.

## Lookups que já mostram o texto

O registro chega com o id e o nome: diga ao campo onde está o nome e nada é pesquisado.

```ts
{ type: 'lookupfield', name: 'evento', displayFrom: 'eventoNome', lookup: 'eventos' }
form.load({ evento: 7, eventoNome: 'Gala' }); // mostra "Gala"; getValues().evento é 7
```

Funciona dentro de linhas de `FieldList`, também numa etapa que ainda não abriu. `field.setValue({ value: 7, label: 'Gala' })` faz à mão.

## Erros do servidor nos campos

```ts
try { await api.save(form.getValues()); }
catch (e) {
  const sobra = form.setErrors(e.fieldErrors); // { slug: 'Em uso', 'criterios.0.nome': 'Repetido' }
  if (sobra.length) toast({ type: 'error', text: sobra.map((p) => e.fieldErrors[p]).join(' ') });
}
```

Caminhos pontilhados alcançam uma linha de `FieldList` (`lista.indice.campo`). O primeiro erro abre a aba ou a etapa do `StepForm` e recebe o foco.

## Valores no formato que a API quer

```ts
{ type: 'numberfield', name: 'preco', format: 'currency', scale: 100 } // o valor são centavos: 123456 mostra 1.234,56
{ type: 'numberfield', name: 'taxa', format: 'percent' }               // o valor é uma fração: 0.15 mostra 15%
{ type: 'datetimefield', name: 'inicio', utc: true }                   // o valor é um instante ISO
```

`setLocale('pt-BR')` e `setCurrency('BRL')` definem o padrão do app inteiro; `locale` e `currency` definem um campo.

## Máscaras, e regras que são suas

```ts
ui.mask('doc', 'CPF/CNPJ', ['000.000.000-00', '00.000.000/0000-00'], { raw: true, validators: [digitosVerificadores] })
```

A máscara conhece `0` (dígito), `A` (letra), `*` (qualquer) e `\` (literal). Formatos de país e dígitos verificadores são do
app: a máscara nunca adivinha um país, e `validators` aceita qualquer função.

## Fechar um formulário alterado

```ts
create({ type: 'window', title: 'Editar lote', confirmDiscard: true, items: [form] });
```

## Dados ao vivo

```ts
const store = new Store({ proxy, remote: true, autoLoad: true });
const stop = store.connect(new EventSource('/eventos/votos')); // mensagens: { op?: 'upsert'|'remove', data?, id? } ou um array
store.applyPatches([{ data: { id: 3, votes: 120 } }, { op: 'remove', id: 9 }]); // à mão, uma repintura
```

Um id conhecido é atualizado no lugar (e **não** é edição local: nada fica sujo; um campo que o usuário está editando
mantém o valor dele), um desconhecido é adicionado. Grids, gráficos, linhas do tempo e o `bind` repintam uma vez por mensagem,
não importa quantos registros ela traga.

## Dashboards

```ts
{ type: 'stat', label: 'Votos', value: 12840, delta: 0.125, trend: [4, 6, 5, 9, 12] }
{ type: 'chart', kind: 'area', x: 'hora', series: ['votos'], store: votosStore, title: 'Votos por hora' }
{ type: 'chart', kind: 'donut', x: 'candidata', series: ['votos'], store: totaisStore }
```

As cores das séries são as `--op-chart-1…8` do tema, então o modo escuro e o tema de um tenant recolorem todo gráfico. Os
dados também estão numa tabela oculta para leitores de tela, e ←/→ percorrem os pontos.

## Exportar e imprimir

```ts
await exportGrid(grid, { format: 'xlsx', filename: 'lotes' }); // colunas visíveis, ordenação e filtros atuais, todas as páginas
await printGrid(grid, { title: 'Lotes' });                      // tabela simples: cabeçalho em cada página, sem o app em volta
```

## Lembrar o layout do usuário

```ts
create({ type: 'grid', columns, resizableColumns: true, plugins: [persistState('grid-lotes')] });
setStateStorage({ get: (k) => api.getPref(k), set: (k, v) => api.setPref(k, v) }); // opcional: acompanha o usuário entre dispositivos
```

## Atalhos

```ts
shortcuts.register({ keys: 'mod+s', title: 'Salvar', handler: () => form.submit() });
shortcuts.register({ keys: 'alt+n', title: 'Novo lote', scope: 'lotes', handler: abrirNovo });
shortcuts.setScope('lotes'); // quando a tela de lotes aparece; `?` abre a lista
```

## Tema a partir de duas cores

```ts
import { defineTheme, loadFonts } from 'optikos';

const marca = defineTheme({
  seeds: { primary: '#D9A441', neutral: '#2A1C12' },       // claro + escuro, pares de texto mantidos em 4.5:1
  font: { family: "'Marca Sans', system-ui, sans-serif" },
  fonts: [{ family: 'Marca Sans', url: '/fonts/marca.woff2', weight: '400 700' }],
}, 'marca');
marca.apply();           // data-op-theme="marca"; some "dark" para o visual noturno: data-op-theme="marca dark"
await loadFonts(marca.fonts);
```

Em localhost o `apply()` também imprime todo par de texto abaixo de 4.5:1 (`checkContrast()` faz sob demanda).

## Desenvolver e testar

```ts
import 'optikos/dev'; // avisa de opções que um componente ignora: "button" has no option "tooltips" (did you mean "tooltip"?)
```

```ts
import { fill, submit, errors, clickRow, loaded, pickLookup } from 'optikos/testing';

const values = await submit(form, { name: 'Ada', 'address.city': 'London' }); // null se inválido
expect(errors(form)).toEqual({});
await loaded(store);
clickRow(grid, (r) => r.get('name') === 'Ada');
await pickLookup(eventLookup, 0);
```
