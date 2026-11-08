// Dev server: bundles sandbox/*, demos/* and the dev index on every change and serves the repo root.
// Usage: node scripts/dev.mjs [sandbox|demo <name>]      (no args → the index at /dev/)
import { context } from 'esbuild';
import { readdirSync, writeFileSync, mkdirSync, watch, existsSync } from 'node:fs';
import { join } from 'node:path';
import { root, buildCss, genIndex, writePages, listPages } from './lib.mjs';

genIndex();

const [kind, name] = process.argv.slice(2);
const port = Number(process.env.PORT || 5173);
const dirs = (d) => (existsSync(join(root, d)) ? readdirSync(join(root, d), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []);
const sandboxes = dirs('sandbox');
const demos = dirs('demos');

const out = join(root, '.dev');
mkdirSync(out, { recursive: true });
const css = () => buildCss(out);
css();
writePages(out);
watch(join(root, 'src'), { recursive: true }, (_, f) => f?.endsWith('.css') && css());
for (const d of ['sandbox', 'demos']) if (existsSync(join(root, d))) watch(join(root, d), { recursive: true }, (_, f) => f?.endsWith('main.ts') && writePages(out));

// Demos get the dev frame (a floating "back to index / go to…" widget) through a generated wrapper entry,
// so the demo source itself stays clean and uses only the public API.
const entries = {};
for (const s of sandboxes) entries[`sandbox/${s}/main`] = `sandbox/${s}/main.ts`;
entries['dev/index'] = 'dev/index.ts';
mkdirSync(join(out, '_entry'), { recursive: true });
for (const d of demos) {
  const wrapper = join(out, '_entry', `${d}.ts`);
  writeFileSync(wrapper, `import '../../dev/demo-frame';\nimport '../../demos/${d}/main';\n`);
  entries[`demos/${d}/main`] = `.dev/_entry/${d}.ts`;
}

const ctx = await context({
  entryPoints: entries,
  outdir: '.dev',
  bundle: true,
  format: 'esm',
  target: 'es2022',
  sourcemap: true,
  // Dev bundles skip tree-shaking by package.json "sideEffects": the demo wrapper's bare imports must never be dropped.
  ignoreAnnotations: true,
  absWorkingDir: root,
  logLevel: 'info',
});
await ctx.watch();
await ctx.serve({ servedir: root, port, host: 'localhost' });

const base = `http://localhost:${port}`;
const target = kind === 'sandbox' && name ? `/sandbox/${name}/` : kind === 'demo' && name ? `/demos/${name}/` : '/dev/';
console.log(`\nOptikos dev server: ${base}${target}   (${listPages().length} pages)`);
