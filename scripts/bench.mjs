// Benchmarks in a real Chromium: bundles scripts/bench.ts, runs every case with Playwright and prints the medians.
// Usage: npm run bench [-- --runs=7]      Needs Chromium: npx playwright install chromium (on a bare Linux, --with-deps).
// Numbers vary between machines; compare runs on the same machine. Results go in docs/performance.md by hand.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { cpus } from 'node:os';
import { root, buildCss } from './lib.mjs';

const runs = Number(process.argv.find((a) => a.startsWith('--runs='))?.slice(7) ?? 7);
const out = join(root, '.dev', 'bench');
mkdirSync(out, { recursive: true });
buildCss(out);
const css = readFileSync(join(out, 'optikos.css'), 'utf8');
const js = (await build({ entryPoints: ['scripts/bench.ts'], bundle: true, format: 'esm', target: 'es2022', minify: true, write: false, absWorkingDir: root })).outputFiles[0].text;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.setContent(`<!doctype html><html><head><style>${css}</style></head><body></body></html>`);
await page.addScriptTag({ type: 'module', content: js });
await page.waitForFunction(() => '__bench' in window);
const results = await page.evaluate((n) => window.__bench(n), runs);
await browser.close();

const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log(`\nOptikos benchmark · Chromium ${browser.version()} · ${cpus()[0]?.model ?? 'unknown CPU'} · median of ${runs} runs\n`);
for (const [name, times] of Object.entries(results)) console.log(`${name.padEnd(52)}${median(times).toFixed(1).padStart(9)} ms   (min ${Math.min(...times).toFixed(1)}, max ${Math.max(...times).toFixed(1)})`);
