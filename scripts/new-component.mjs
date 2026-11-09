// Scaffolds a component: spec sheet, .ts, .css, test and a sandbox section.
// Usage: node scripts/new-component.mjs <category> <name>
import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { root, genIndex } from './lib.mjs';

const [category, name] = process.argv.slice(2);
if (!category || !/^[a-z][a-z0-9]*$/.test(name ?? '')) {
  console.error('Usage: npm run new:component -- <category> <name>   (name: lowercase letters/digits)');
  process.exit(1);
}
const Class = name[0].toUpperCase() + name.slice(1);
const dir = join(root, 'src/components', category, name);
if (existsSync(dir)) {
  console.error(`Already exists: src/components/${category}/${name}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

// the spec sheet in English and its Portuguese translation, both from their language's template
for (const [dir, title] of [['docs/components', '<Name>'], ['docs/pt-BR/components', '<Nome>']]) {
  const ficha = join(root, dir, `${name}.md`);
  if (existsSync(ficha)) continue;
  const model = readFileSync(join(root, dir, '_modelo.md'), 'utf8').match(/```md\n([\s\S]*?)```/)[1];
  writeFileSync(ficha, model.replace(title, Class).replace("'<type>'", `'${name}'`));
}

writeFileSync(join(dir, `${name}.ts`), `import { Component, type ComponentConfig, register } from 'optikos/core';

export interface ${Class}Config extends ComponentConfig {
  text?: string;
}

export class ${Class} extends Component<${Class}Config> {
  protected override baseCls = 'op-${name}';

  protected override onRender() {
    this.setText(this.config.text ?? '');
  }

  setText(text: string) {
    this.config.text = text;
    if (this.rendered) this.el.textContent = text;
  }
}
register('${name}', ${Class});
`.replace("'optikos/core'", "'../../../core/index'"));

writeFileSync(join(dir, `${name}.css`), `@layer optikos {
  .op-${name} {
    color: var(--op-${name}-fg, var(--op-color-fg));
  }
}
`);

writeFileSync(join(dir, `${name}.test.ts`), `import { describe, it, expect } from 'vitest';
import { create, ${Class} } from 'optikos';

describe('${Class}', () => {
  it('renders text and updates through its setter', () => {
    const c = create<${Class}>({ type: '${name}', text: 'hi' });
    expect(c.el.textContent).toBe('hi');
    c.setText('bye');
    expect(c.el.textContent).toBe('bye');
  });
});
`);

const sandbox = join(root, 'sandbox', category, 'main.ts');
if (existsSync(sandbox)) {
  appendFileSync(sandbox, `
// ${name}
import { create as create_${name} } from 'optikos';
p.section('${Class}', 'TODO: show every case of docs/components/${name}.md', (host) => {
  create_${name}({ type: '${name}', text: '${Class}', renderTo: host });
});
`);
}
genIndex();
console.log(`Created src/components/${category}/${name}, docs/components/${name}.md (+ docs/pt-BR/components/${name}.md) and a sandbox section.\nNext: fill the spec sheet first (both languages), then the code. Add an example to site/examples.json.`);
