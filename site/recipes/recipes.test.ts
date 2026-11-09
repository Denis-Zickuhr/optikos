// Every recipe mounts, shows something and cleans up after itself (they are what the docs site runs).
import { describe, it, expect } from 'vitest';
import { recipes } from './index';

describe('docs recipes', () => {
  for (const r of recipes) {
    it(`${r.id} mounts and cleans up`, () => {
      const host = document.body.appendChild(document.createElement('div'));
      const stop = r.mount(host);
      expect(host.children.length, r.id).toBeGreaterThan(0);
      stop();
      expect(host.children.length, `${r.id} left nodes behind`).toBe(0);
      host.remove();
      for (const k of ['title', 'intro'] as const) expect(typeof r[k] === 'object' && r[k]['pt-BR'] && r[k].en, `${r.id}.${k}`).toBeTruthy();
    });
  }
});
