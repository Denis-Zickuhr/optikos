# Começar

## Instalar

```sh
npm i optikos
```

O Optikos não tem dependências em runtime e funciona com qualquer bundler (Vite, esbuild, webpack...) ou direto de uma CDN que sirva ES modules.

## Sua primeira tela

```ts
import { create, toast, type Form } from 'optikos';
import 'optikos/optikos.css';

const form = create<Form>({
  type: 'form',
  items: [
    { type: 'textfield', name: 'name', label: 'Nome', required: true },
    { type: 'textfield', name: 'email', label: 'Email', inputType: 'email' },
    { type: 'select', name: 'plan', label: 'Plano', options: ['Free', 'Pro'] },
  ],
});

create({
  type: 'panel', title: 'Novo cliente', renderTo: document.body, items: [form],
  buttons: [{ text: 'Salvar', variant: 'primary', handler: () => form.isValid() && toast(`${form.getValues().name} salvo`) }],
});
```

`create()` monta uma árvore de componentes a partir de uma config. Cada `type` é uma classe de componente registrada,
então a mesma tela pode ser escrita com classes (`new TextField({...})`) ou com os atalhos `ui` (`ui.text('name', 'Nome')`).

## Escolha um visual

```ts
import 'optikos/themes/dark.css';
document.documentElement.setAttribute('data-op-theme', 'dark');
```

Temas prontos: `light` (padrão), `dark`, `compact`, `corporate`, `soft`, `brutal`, `terminal`, `editorial`, `brand`.
Os temas se combinam (`"dark compact"`) e podem valer só para um elemento. Um tema seu sai em poucas linhas com
`defineTheme` (veja o guia **Tematização**).

## Importe só o que usa

`import ... from 'optikos'` registra todos os componentes. Para um bundle menor, importe o núcleo e os componentes que precisa:

```ts
import { create } from 'optikos/core';
import 'optikos/components/button';
import 'optikos/components/grid';
```

## Próximos passos

- **Componentes**: todos os componentes com exemplos vivos e a ficha (config, API, eventos, teclado, tokens).
- **Receitas**: telas pequenas e completas para copiar (cadastro, lista de pedidos, configurações, checkout...).
- **Demos**: apps inteiros feitos só com a API pública.
- Guias: **Tematização**, **Escrita enxuta (ui e enums)**, **Motion**, **Performance**.
