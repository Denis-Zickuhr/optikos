/// <reference types="vite/client" />
// Browser tests get the real stylesheet, in the same order as scripts/lib.mjs buildCss(), plus every theme (the shipped
// ones and the dev-only looks of dev/themes). Motion off.
// (Vite needs the glob options written out as a literal in every call.)
import { motion } from './motion/config';

const inline = (files: Record<string, string>) => Object.keys(files).sort().map((k) => files[k]);
const css = [
  ...inline(import.meta.glob<string>('./themes/base.css', { query: '?inline', import: 'default', eager: true })),
  ...inline(import.meta.glob<string>('./core/**/*.css', { query: '?inline', import: 'default', eager: true })),
  ...inline(import.meta.glob<string>('./layout/**/*.css', { query: '?inline', import: 'default', eager: true })),
  ...inline(import.meta.glob<string>('./components/**/*.css', { query: '?inline', import: 'default', eager: true })),
  ...inline(import.meta.glob<string>('./motion/**/*.css', { query: '?inline', import: 'default', eager: true })),
  ...inline(import.meta.glob<string>(['./themes/*.css', '!./themes/base.css'], { query: '?inline', import: 'default', eager: true })),
  ...inline(import.meta.glob<string>('../dev/themes/*.css', { query: '?inline', import: 'default', eager: true })),
];
document.head.append(Object.assign(document.createElement('style'), { textContent: css.join('\n') }));
motion.disable();
