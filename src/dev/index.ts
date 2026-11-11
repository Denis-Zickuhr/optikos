// Development aid: `import 'optikos/dev'` warns in the console about config options a component does not know
// (a typo, or an option that belongs to another type). It switches itself on at localhost; elsewhere call `enableConfigWarnings()`.
import { Component } from '../core/component';
import { isDev } from '../core/dev';
import { keys } from './keys';

const known = new Map<string, Set<string>>();
const warned = new Set<string>();

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Starts warning; returns the function that stops it. Each type/option pair warns once. */
export function enableConfigWarnings(): () => void {
  Component.onCreate = (c) => {
    const type = c.config.type;
    if (!type || !(type in keys)) return;
    let ok = known.get(type);
    if (!ok) known.set(type, (ok = new Set(keys[type].split(' '))));
    for (const k in c.config) {
      const id = `${type}.${k}`;
      if (ok.has(k) || warned.has(id)) continue;
      warned.add(id);
      const near = [...ok].find((x) => distance(x.toLowerCase(), k.toLowerCase()) <= 2);
      console.warn(`Optikos: "${type}" has no option "${k}", so it is ignored${near ? ` (did you mean "${near}"?)` : ''}`);
    }
  };
  return () => (Component.onCreate = undefined);
}

if (isDev()) enableConfigWarnings();
