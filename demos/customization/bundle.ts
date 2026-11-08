// A "bundle": components + layout + theme registered together. (Phase 9 adds defineBundle/use; until then it is a plain function.)
import { Field, register, registerLayout, defineTheme, h, type FieldConfig, type Layout } from 'optikos';

export interface StarsConfig extends FieldConfig<number> {
  max?: number;
}

/** A custom FIELD: gets label, validation, dirty tracking, Form load/getValues for free by extending Field. */
export class Stars extends Field<number, StarsConfig> {
  protected override baseCls = 'op-field demo-stars';
  private stars: HTMLButtonElement[] = [];

  protected override emptyValue() {
    return 0;
  }
  protected override isEmpty(v: number) {
    return !v;
  }

  protected createControl() {
    const root = h('div', 'demo-stars__row', { role: 'radiogroup', 'aria-label': this.config.label ?? 'Rating' });
    this.inputEl = root;
    for (let i = 1; i <= (this.config.max ?? 5); i++) {
      const b = h('button', 'demo-stars__star', { type: 'button', role: 'radio', 'aria-label': `${i}`, tabindex: -1 }, '★');
      // setValue (not commit) because there is no native control: the stars must be repainted and `change` emitted
      this.listen(b, 'click', () => this.setValue(this.value === i ? 0 : i));
      this.listen(b, 'keydown', (e: KeyboardEvent) => {
        const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
        if (d) {
          e.preventDefault();
          this.setValue(Math.max(0, Math.min(this.config.max ?? 5, this.value + d)));
        }
      });
      this.stars.push(b);
      root.append(b);
    }
    return root;
  }

  protected applyValue(v: number) {
    this.stars.forEach((s, i) => {
      s.classList.toggle('is-on', i < v);
      s.setAttribute('aria-checked', String(i + 1 === v));
      s.tabIndex = i + 1 === (v || 1) ? 0 : -1;
    });
  }
}

/** A custom LAYOUT: children stacked with a rotating tilt, to show layouts are plain strategies. */
const polaroid = (): Layout => ({
  init: (c) => c.getBody().classList.add('demo-polaroid'),
  add: (_c, cmp, i) => cmp.el.style.setProperty('--tilt', `${(i % 2 ? 1 : -1) * (2 + i)}deg`),
});

export const oceanTheme = defineTheme({ color: { primary: '#7c3aed', primaryHover: '#6d28d9', primarySoft: '#f5f3ff', focus: '#a78bfa' }, button: { radius: '62.5rem' }, panel: { radius: '1rem' } }, 'violet');

export function installBundle() {
  register('stars', Stars);
  registerLayout('polaroid', polaroid);
  oceanTheme.inject(); // available in the theme picker, not active until chosen
}
