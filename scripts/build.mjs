// Library build: JS (esbuild), CSS, .d.ts (tsc) and the gzip size report (fails over budget).
import { build } from 'esbuild';
import { rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { join, relative, dirname } from 'node:path';
import { root, componentEntries, buildCss, genIndex, genKeys } from './lib.mjs';

genIndex();
genKeys();

// Budgets in bytes (gzip). `core` and `data` are absolute; a component is judged by what it adds over the bare runtime
// (Component + register + create), so shared dependencies (Field, Toolbar...) count against whoever needs them.
const CORE_BUDGET = 9 * 1024;
const DATA_BUDGET = 4.75 * 1024;
// Composites carry their whole dependency chain (Field → TextField → PickerField → Dropdown + ListBox...), hence the higher caps.
const COMPONENT_BUDGET = { default: 7 * 1024, panel: 7.5 * 1024, navmenu: 11 * 1024, breadcrumb: 8 * 1024, window: 9.25 * 1024, shortcuts: 10.25 * 1024, datetimefield: 11 * 1024, widget: 9.5 * 1024, dataview: 8.5 * 1024, pickerfield: 9.75 * 1024, select: 9.75 * 1024, combobox: 10 * 1024, datefield: 10 * 1024, daterangefield: 10 * 1024, suggestfield: 10.25 * 1024, messagebox: 12 * 1024, grid: 21 * 1024, filterbuilder: 16 * 1024, searchgrid: 22 * 1024, stepform: 11.25 * 1024, secretfield: 13 * 1024, lookupfield: 30.5 * 1024, viewmanager: 16.75 * 1024 };

const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const comps = componentEntries();
const entries = { index: 'src/index.ts', core: 'src/core/index.ts', data: 'src/data/index.ts', bind: 'src/bind/index.ts', motion: 'src/motion/index.ts', ui: 'src/ui/index.ts', build: 'src/build/index.ts', testing: 'src/testing/index.ts', dev: 'src/dev/index.ts' };
for (const [name, file] of Object.entries(comps)) entries[`components/${name}`] = relative(root, file);

const common = { bundle: true, format: 'esm', target: 'es2022', minify: true, absWorkingDir: root, logLevel: 'warning' };

await build({ ...common, entryPoints: entries, outdir: 'dist', splitting: true, sourcemap: true });
buildCss(dist);

execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.build.json'], { cwd: root, stdio: 'inherit' });
mkdirSync(join(dist, 'types/components'), { recursive: true });
for (const [name, file] of Object.entries(comps)) {
  const rel = relative(join(root, 'src'), file).replace(/\.ts$/, '.js');
  writeFileSync(join(dist, `types/components/${name}.d.ts`), `export * from '../${rel}';\n`);
}
// Declarations must name files ('./x.js', './dir/index.js'): moduleResolution node16/nodenext resolves nothing without the extension.
for (const rel of readdirSync(join(dist, 'types'), { recursive: true })) {
  if (!rel.endsWith('.d.ts')) continue;
  const file = join(dist, 'types', rel);
  const src = readFileSync(file, 'utf8');
  const out = src.replace(/(from\s+|import\(|^import\s+)(['"])(\.\.?\/[^'"]*?)\2/gm, (m, pre, q, spec) =>
    spec.endsWith('.js') ? m : `${pre}${q}${spec}${existsSync(join(dirname(file), `${spec}.d.ts`)) ? '.js' : '/index.js'}${q}`);
  if (out !== src) writeFileSync(file, out);
}

// --- size report: every entry bundled alone (what a user who imports only it pays) ---
const gz = (s) => gzipSync(s, { level: 9 }).length;
const kb = (n) => (n / 1024).toFixed(2).padStart(7) + ' kB';
async function standalone(entry) {
  const r = await build({ ...common, entryPoints: [entry], write: false, outdir: 'out' });
  return gz(r.outputFiles[0].contents);
}

const sizes = {};
for (const key of ['core', 'data', 'bind', 'motion', 'ui', 'build', 'testing', 'index']) sizes[key] = await standalone(entries[key]);
const baseline = gz((await build({ ...common, stdin: { contents: "export { Component } from './src/core/component.ts'; export { register, create } from './src/core/registry.ts';", resolveDir: root }, write: false, outdir: 'out' })).outputFiles[0].contents);
const rows = [];
let failed = false;
for (const [name, file] of Object.entries(comps)) {
  const total = await standalone(relative(root, file));
  const delta = Math.max(0, total - baseline);
  const budget = COMPONENT_BUDGET[name] ?? COMPONENT_BUDGET.default;
  const cssFile = join(dist, 'css', `${name}.css`);
  const css = existsSync(cssFile) ? gz(readFileSync(cssFile)) : 0;
  const over = delta > budget;
  failed ||= over;
  rows.push(`${name.padEnd(18)}${kb(delta)}   css ${kb(css)}   total ${kb(total)}${over ? `   OVER BUDGET (${kb(budget)})` : ''}`);
}
const coreOver = sizes.core > CORE_BUDGET;
const dataOver = sizes.data > DATA_BUDGET;
failed ||= coreOver || dataOver;
console.log('\nGzip sizes (JS minified)');
console.log(`core ${kb(sizes.core)}  (budget ${kb(CORE_BUDGET)})${coreOver ? '  OVER BUDGET' : ''}`);
console.log(`data ${kb(sizes.data)}  (budget ${kb(DATA_BUDGET)})${dataOver ? '  OVER BUDGET' : ''}`);
console.log(`bind ${kb(sizes.bind)}`);
console.log(`motion ${kb(sizes.motion)}`);
console.log(`testing ${kb(sizes.testing)}  (dev only: not part of the app bundle)`);
console.log(`build ${kb(sizes.build)}  (field specs → columns, form, filters; includes what they build)`);
console.log(`ui ${kb(sizes.ui)}  (enums + shortcuts; includes the fields they build)`);
console.log(`runtime baseline (Component + register + create) ${kb(baseline)}`);
console.log(`full ${kb(sizes.index)}  (all components, JS)`);
console.log(`full css ${kb(gz(readFileSync(join(dist, 'optikos.css'))))}`);
console.log('\ncomponent (added over baseline) / own css / standalone total');
rows.forEach((r) => console.log(r));
if (failed) {
  console.error('\nSize budget exceeded.');
  process.exit(1);
}
