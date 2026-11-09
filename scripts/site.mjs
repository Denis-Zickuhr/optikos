// Docs site: bundles site/main.ts and writes site.json (docs, examples, recipe sources, real sizes).
// Usage: node scripts/site.mjs          serves the repo root with live rebuild (PORT=5180 by default)
//        node scripts/site.mjs build    writes the static site to site-dist/ (what GitHub Pages publishes), demos included
import { build, context } from 'esbuild';
import { writeFileSync, readFileSync, mkdirSync, rmSync, watch, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { gzipSync } from 'node:zlib';
import { root, buildCss, genIndex, componentEntries, listPages } from './lib.mjs';
import { siteData } from './docs-data.mjs';

genIndex();
const bundle = { bundle: true, format: 'esm', target: 'es2022', absWorkingDir: root };

/** Gzip size (kB) of the core, of everything, and of each component bundled alone: the numbers on the home page. */
async function sizes() {
  const kb = async (entry) => {
    const r = await build({ ...bundle, entryPoints: [entry], minify: true, write: false, outdir: 'out', logLevel: 'silent' });
    return Math.round((gzipSync(r.outputFiles[0].contents, { level: 9 }).length / 1024) * 10) / 10;
  };
  const components = {};
  for (const [name, file] of Object.entries(componentEntries())) components[name] = await kb(file);
  return { core: await kb('src/core/index.ts'), full: await kb('src/index.ts'), components };
}

/** The source of each recipe (site/recipes/<id>.ts): the site shows exactly the code it runs. */
const recipeSources = () => Object.fromEntries(readdirSync(join(root, 'site/recipes')).filter((f) => f.endsWith('.ts') && !f.includes('.test.') && f !== 'index.ts').map((f) => [basename(f, '.ts'), readFileSync(join(root, 'site/recipes', f), 'utf8')]));
const version = () => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const demos = () => listPages().filter((p) => p.kind === 'demo').map((p) => p.name);

if (process.argv[2] === 'build') {
  // Everything with relative paths, so it works under any base URL (https://<user>.github.io/<repo>/).
  const out = join(root, 'site-dist');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  buildCss(out);
  writeFileSync(join(out, 'site.json'), JSON.stringify({ ...siteData(), version: version(), recipes: recipeSources(), demos: demos(), sizes: await sizes(), static: true }));
  writeFileSync(join(out, 'index.html'), readFileSync(join(root, 'site/index.html'), 'utf8').replaceAll('/.dev/site/main.js', './main.js').replaceAll('/.dev/', './'));

  // The demos, without the dev frame: their own index.html with relative paths, their local files, shared chunks.
  const entries = { main: 'site/main.ts' };
  for (const d of demos()) {
    const dir = join(root, 'demos', d);
    mkdirSync(join(out, 'demos', d), { recursive: true });
    let html = readFileSync(join(dir, 'index.html'), 'utf8').replaceAll(`/.dev/demos/${d}/main.js`, './main.js');
    // a demo with a dev-only look (dev/themes) carries its own copy: the site itself publishes only light and dark
    html = html.replace(/\/\.dev\/themes\/([\w-]+)\.css/g, (m, name) => {
      if (!existsSync(join(root, 'dev/themes', `${name}.css`))) return m;
      copyFileSync(join(root, 'dev/themes', `${name}.css`), join(out, 'demos', d, `${name}.css`));
      return `./${name}.css`;
    });
    html = html.replaceAll('/.dev/', '../../').replaceAll(`/demos/${d}/`, './');
    writeFileSync(join(out, 'demos', d, 'index.html'), html);
    for (const f of readdirSync(dir)) if (!/\.(ts|html)$/.test(f)) copyFileSync(join(dir, f), join(out, 'demos', d, f));
    entries[`demos/${d}/main`] = `demos/${d}/main.ts`;
  }
  await build({ ...bundle, entryPoints: entries, outdir: out, splitting: true, minify: true, chunkNames: 'chunks/[hash]', logLevel: 'warning' });
  console.log(`Static docs site written to site-dist/ (with ${demos().length} demos). Serve that folder to preview it.`);
} else {
  const out = join(root, '.dev');
  mkdirSync(out, { recursive: true });
  const css = () => buildCss(out);
  const measured = await sizes();
  const data = () => writeFileSync(join(out, 'site.json'), JSON.stringify({ ...siteData(), version: version(), recipes: recipeSources(), demos: demos(), sizes: measured }));
  css();
  data();
  watch(join(root, 'src'), { recursive: true }, (_, f) => f?.endsWith('.css') && css());
  for (const d of ['docs', 'site']) watch(join(root, d), { recursive: true }, (_, f) => /\.(md|json|ts)$/.test(f ?? '') && data());

  const port = Number(process.env.PORT || 5180);
  const ctx = await context({ ...bundle, entryPoints: { 'site/main': 'site/main.ts' }, outdir: '.dev', sourcemap: true, logLevel: 'info' });
  await ctx.watch();
  await ctx.serve({ servedir: root, port, host: 'localhost' });
  console.log(`\nOptikos docs: http://localhost:${port}/site/   (demos open on the dev server: npm run dev)`);
  if (!existsSync(join(out, 'demos'))) console.log('Tip: run `npm run dev` too, so the demo links work.');
}
