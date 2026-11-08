// Turns a theme written with defineTheme() (TS) into a plain CSS file.
// Usage: node scripts/theme.mjs <theme.ts> <out.css>   (the file must `export default defineTheme(...)`)
import { build } from 'esbuild';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './lib.mjs';

const [file, out] = process.argv.slice(2);
if (!file || !out) {
  console.error('Usage: node scripts/theme.mjs <theme.ts> <out.css>');
  process.exit(1);
}
const tmp = join(mkdtempSync(join(tmpdir(), 'optikos-theme-')), 'theme.mjs');
await build({ entryPoints: [file], outfile: tmp, bundle: true, format: 'esm', platform: 'node', absWorkingDir: root, tsconfig: join(root, 'tsconfig.json'), logLevel: 'warning' });
const theme = (await import(pathToFileURL(tmp).href)).default;
writeFileSync(out, theme.css);
console.log(`Wrote ${out} (theme "${theme.name}")`);
