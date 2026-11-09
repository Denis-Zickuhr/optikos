// Accessibility: axe-core on every docs example, in a real browser with the real CSS (so color contrast is measured),
// in the light and the dark theme. Floating examples (windows, menus, toasts...) are opened first and checked in the layer.
import { describe, it, expect, afterEach } from 'vitest';
import axe from 'axe-core';
import examples from './examples.json';
import { run, type Example } from './render';
import { recipes } from './recipes/index';

const THEMES = ['light', 'dark', 'corporate', 'soft', 'brutal', 'terminal', 'editorial', 'brand', 'brand night', 'dark compact'];
// Rules about a whole page (one h1, landmarks, title) do not apply to a component shown alone.
const PAGE_RULES = Object.fromEntries(['region', 'page-has-heading-one', 'landmark-one-main', 'document-title', 'html-has-lang'].map((r) => [r, { enabled: false }]));
// The Grid's scrolling viewport is not a tab stop on purpose: the focusable role=grid around it moves the active row with
// the arrows/PageUp/PageDown (aria-activedescendant), which scrolls it. axe cannot see that and flags the viewport.
const exempt = (rule: string, node: axe.NodeResult) => rule === 'scrollable-region-focusable' && node.html.startsWith('<div class="op-grid__viewport"');
const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-op-theme');
});

async function violations(root: Element | Document) {
  const res = await axe.run(root, { resultTypes: ['violations'], rules: PAGE_RULES });
  return res.violations
    .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !exempt(v.id, n)) }))
    .filter((v) => v.nodes.length)
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => `${n.html.slice(0, 140)} → ${(n.failureSummary ?? '').split('\n').slice(1, 3).join(' ').trim()}`).join(' | ')}`);
}

describe('accessibility of the docs examples (axe)', () => {
  for (const theme of THEMES) {
    for (const [name, list] of Object.entries(examples as Record<string, Example[]>)) {
      list.forEach((ex, i) => {
        if (!ex.config) return;
        it(`${theme} · ${name} · ${typeof ex.title === 'string' ? ex.title : ex.title.en}`, async () => {
          document.documentElement.setAttribute('data-op-theme', theme);
          const stage = document.body.appendChild(document.createElement('main'));
          stage.setAttribute('aria-label', `${name} example ${i + 1}`);
          stage.style.margin = '4rem'; // the test pointer rests at (0,0): keep examples out of :hover
          const stop = run(ex, ex.config!, stage);
          await frame();
          if (ex.launch && ex.launch !== 'inline') {
            stage.querySelector<HTMLButtonElement>('button')!.click();
            await frame();
            await new Promise((r) => setTimeout(r, 50));
          }
          // let entrance animations end (opacity mid-fade would fail contrast); spinners loop forever, skip those
          await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {})));
          expect(await violations(document)).toEqual([]);
          stop();
        });
      });
    }
  }
});

describe('accessibility of the docs recipes (axe)', () => {
  for (const theme of ['light', 'dark']) {
    for (const r of recipes) {
      it(`${theme} · recipe ${r.id}`, async () => {
        document.documentElement.setAttribute('data-op-theme', theme);
        const stage = document.body.appendChild(document.createElement('main'));
        stage.style.margin = '4rem';
        const stop = r.mount(stage);
        await frame();
        await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity).map((a) => a.finished.catch(() => {})));
        expect(await violations(document)).toEqual([]);
        stop();
      });
    }
  }
});
