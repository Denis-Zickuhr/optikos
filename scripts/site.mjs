// Docs site server: bundles site/main.ts, writes .dev/site.json from docs/ + site/examples.json, serves the repo root.
// Usage: node scripts/site.mjs      (PORT=5180 by default)
import { context } from 'esbuild';
import { writeFileSync, mkdirSync, watch } from 'node:fs';
import { join } from 'node:path';
import { root, buildCss, genIndex } from './lib.mjs';
import { siteData } from './docs-data.mjs';

genIndex();
const out = join(root, '.dev');
mkdirSync(out, { recursive: true });
const css = () => buildCss(out);
const data = () => writeFileSync(join(out, 'site.json'), JSON.stringify(siteData()));
css();
data();
watch(join(root, 'src'), { recursive: true }, (_, f) => f?.endsWith('.css') && css());
for (const d of ['docs', 'site']) watch(join(root, d), { recursive: true }, (_, f) => /\.(md|json)$/.test(f ?? '') && data());

const port = Number(process.env.PORT || 5180);
const ctx = await context({ entryPoints: { 'site/main': 'site/main.ts' }, outdir: '.dev', bundle: true, format: 'esm', target: 'es2022', sourcemap: true, absWorkingDir: root, logLevel: 'info' });
await ctx.watch();
await ctx.serve({ servedir: root, port, host: 'localhost' });
console.log(`\nOptikos docs: http://localhost:${port}/site/`);
