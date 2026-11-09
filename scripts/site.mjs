// Docs site: bundles site/main.ts and writes site.json from docs/ + site/examples.json.
// Usage: node scripts/site.mjs          serves the repo root with live rebuild (PORT=5180 by default)
//        node scripts/site.mjs build    writes the static site to site-dist/ (what GitHub Pages publishes)
import { build, context } from 'esbuild';
import { writeFileSync, readFileSync, mkdirSync, rmSync, watch } from 'node:fs';
import { join } from 'node:path';
import { root, buildCss, genIndex } from './lib.mjs';
import { siteData } from './docs-data.mjs';

genIndex();
const bundle = { bundle: true, format: 'esm', target: 'es2022', absWorkingDir: root };

if (process.argv[2] === 'build') {
  // Everything flat in one folder with relative paths, so it works under any base URL (https://<user>.github.io/<repo>/).
  const out = join(root, 'site-dist');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  buildCss(out);
  writeFileSync(join(out, 'site.json'), JSON.stringify({ ...siteData(), static: true }));
  writeFileSync(join(out, 'index.html'), readFileSync(join(root, 'site/index.html'), 'utf8').replaceAll('/.dev/site/main.js', './main.js').replaceAll('/.dev/', './'));
  await build({ ...bundle, entryPoints: { main: 'site/main.ts' }, outdir: out, minify: true, logLevel: 'warning' });
  console.log(`Static docs site written to site-dist/ (serve that folder to preview it)`);
} else {
  const out = join(root, '.dev');
  mkdirSync(out, { recursive: true });
  const css = () => buildCss(out);
  const data = () => writeFileSync(join(out, 'site.json'), JSON.stringify(siteData()));
  css();
  data();
  watch(join(root, 'src'), { recursive: true }, (_, f) => f?.endsWith('.css') && css());
  for (const d of ['docs', 'site']) watch(join(root, d), { recursive: true }, (_, f) => /\.(md|json)$/.test(f ?? '') && data());

  const port = Number(process.env.PORT || 5180);
  const ctx = await context({ ...bundle, entryPoints: { 'site/main': 'site/main.ts' }, outdir: '.dev', sourcemap: true, logLevel: 'info' });
  await ctx.watch();
  await ctx.serve({ servedir: root, port, host: 'localhost' });
  console.log(`\nOptikos docs: http://localhost:${port}/site/`);
}
