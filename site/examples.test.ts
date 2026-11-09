// Renders every docs example in happy-dom: a wrong config in site/examples.json fails here, not in front of a reader.
import { describe, it, expect } from 'vitest';
import { components } from '../scripts/docs-data.mjs';
import { run, type Example } from './render';

describe('docs examples', () => {
  for (const c of components()) {
    for (const ex of c.examples as Example[]) {
      if (!ex.config) continue;
      it(`${c.name}: ${typeof ex.title === 'string' ? ex.title : ex.title.en}`, () => {
        const stage = document.body.appendChild(document.createElement('div'));
        const stop = run(ex, ex.config!, stage);
        expect(stage.children.length).toBeGreaterThan(0);
        stop();
        stage.remove();
      });
    }
  }
});
