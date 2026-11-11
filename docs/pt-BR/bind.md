# Binding e view model (`optikos/bind`)

Os componentes só conhecem setters (`setText`, `setDisabled`, `setValue`...). `optikos/bind` é uma camada opcional por
cima: signals, `bind(cmp, { text: () => ... })` e, para telas que compartilham estado, um **view model** no espírito do
`ViewModel` do Ext. Nenhum componente o importa.

## Signals

```ts
import { signal, computed, effect, fromStore, bind } from 'optikos/bind';

const n = signal(1);
bind(button, { text: () => `Contagem: ${n()}`, disabled: () => n() > 9 });
```

## Um view model: dados compartilhados, fórmulas, um registro

```ts
import { viewModel, bindVM, bindForm } from 'optikos/bind';

const vm = viewModel({
  data: { qtd: 2, preco: 10 },
  formulas: { total: (get) => get('qtd') * get('preco'), podeSalvar: (get) => get('total') > 0 },
});

vm.get('total');          // 20; dentro de um effect/bind ele rastreia, então o leitor roda de novo quando qtd ou preco mudam
vm.set('qtd', 3);         // caminhos pontilhados funcionam: vm.set('record.endereco.cidade', 'Rio')

grid.on('select', (recs) => vm.link('record', recs[0] ?? null)); // um Model: escrever passa por model.set (marcado como alterado)
```

`bindVM` é o `bind: { ... }` do Ext para qualquer componente. Uma string que é exatamente `{caminho}` é aquele valor
(`{!caminho}` a negação), qualquer outra coisa é um template:

```ts
bindVM(titulo, vm, { text: 'Editando {record.nome}' });
bindVM(salvar, vm, { disabled: '{!podeSalvar}', hidden: '{!record}' });
bindVM(nome,   vm, { value: '{record.nome}' });          // um campo: duas vias, o `change` dele escreve de volta
bindForm(form, vm, 'record');                            // todo campo nomeado do form, duas vias
```

`bindForm` carrega o form quando um registro é ligado e o deixa limpo (um form só fica sujo depois que o usuário edita); as
edições escrevem no registro, e um `Model` fica marcado como alterado para `store.getModified()` e `store.sync()` o verem.

## O que está coberto do ViewModel do Ext

| Ext | Optikos |
|---|---|
| `data`, `get('a.b')`, `set('a.b', v)` | `viewModel({ data })`, `vm.get`, `vm.set` |
| `formulas` (com dependências entre elas) | `formulas`, lidas com `get`; preguiçosas e em cache |
| `bind: '{record.nome}'`, `'{!busy}'`, `'Oi {nome}'` | `bindVM(cmp, vm, { prop: '...' })` |
| `value` em duas vias | o mesmo, nos campos |
| `links` / `setLinks` para um registro | `vm.link(nome, model)` |
| ligar um form a um registro | `bindForm(form, vm, nome)` |
| `stores` no view model | desnecessário: um `Store` é um objeto; use `fromStore(store)` para lê-lo num effect |
| hierarquia de ViewModels (herança pai/filho) | não coberto: use um view model por tela e passe adiante |
| `twoWayBindable`, `deep`, opções de `bind` | não coberto |
