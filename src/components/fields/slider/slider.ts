import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { knobStretch } from '../../../motion/extras';

export interface SliderMark {
  value: number;
  label?: string;
}

export interface SliderConfig extends FieldConfig<number | [number, number]> {
  min?: number;
  max?: number;
  step?: number;
  /** Two knobs: the value is `[low, high]`. */
  range?: boolean;
  marks?: boolean | SliderMark[];
  /** When the bubble with the value shows. Default `drag` (while dragging or focused). */
  showValue?: 'drag' | 'always' | 'never';
  format?: (v: number) => string;
  showScale?: boolean;
}

type V = number | [number, number];

/** A bar with a ball to drag: a number, or a range with two balls. */
export class Slider extends Field<V, SliderConfig> {
  protected override baseCls = 'op-field op-slider';
  private track!: HTMLElement;
  private fill!: HTMLElement;
  private knobs: HTMLElement[] = [];
  private bubbles: HTMLElement[] = [];
  private marksEl!: HTMLElement;

  private get min() {
    return this.config.min ?? 0;
  }
  private get max() {
    return this.config.max ?? 100;
  }
  private get step() {
    return this.config.step ?? 1;
  }
  private get isRange() {
    return !!this.config.range;
  }

  protected override emptyValue(): V {
    return this.isRange ? [this.min, this.max] : this.min;
  }
  protected override isEmpty(): boolean {
    return false;
  }

  private fmt(v: number): string {
    return this.config.format ? this.config.format(v) : String(v);
  }
  private vals(): number[] {
    return Array.isArray(this.value) ? [...this.value] : [this.value as number];
  }

  /** Snaps to a multiple of `step` inside [min, max] (without float noise). */
  private snap(v: number): number {
    const n = Math.round((v - this.min) / this.step) * this.step + this.min;
    const dec = (String(this.step).split('.')[1] ?? '').length;
    return Math.max(this.min, Math.min(this.max, Number(n.toFixed(dec))));
  }

  protected createControl() {
    const c = this.config;
    this.track = h('div', 'op-slider__track');
    this.fill = h('div', 'op-slider__fill');
    this.marksEl = h('div', 'op-slider__marks', { 'aria-hidden': 'true' });
    this.track.append(this.fill, this.marksEl);
    this.buildKnobs();
    this.listen(this.track, 'pointerdown', (e: PointerEvent) => this.onTrackDown(e));
    const box = h('div', 'op-slider__box', {}, this.track);
    if (c.showScale) box.append(h('div', 'op-slider__scale', {}, h('span', '', {}, this.fmt(this.min)), h('span', '', {}, this.fmt(this.max))));
    this.inputEl = this.knobs[0];
    return box;
  }

  private buildKnobs() {
    this.knobs.forEach((k) => k.remove());
    this.knobs = [];
    this.bubbles = [];
    const n = this.isRange ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const bubble = h('span', 'op-slider__bubble', { 'aria-hidden': 'true' });
      const knob = h('div', 'op-slider__knob', { role: 'slider', tabindex: 0, 'aria-orientation': 'horizontal', 'data-i': i }, bubble);
      this.listen(knob, 'pointerdown', (e: PointerEvent) => this.onKnobDown(e, i));
      this.listen(knob, 'keydown', (e: KeyboardEvent) => this.onKey(e, i));
      this.listen(knob, 'focus', () => this.el.classList.add('is-focus-knob'));
      this.listen(knob, 'blur', () => this.el.classList.remove('is-focus-knob'));
      this.knobs.push(knob);
      this.bubbles.push(bubble);
      this.track.append(knob);
    }
  }

  protected override onRender() {
    super.onRender();
    this.knobs.forEach((k) => k.setAttribute('aria-labelledby', `${this.id}-label`));
    (this.el.querySelector('.op-field__label') as HTMLElement).id = `${this.id}-label`;
    this.paintMarks();
    this.el.classList.toggle('has-bubble-always', this.config.showValue === 'always');
    this.el.classList.toggle('has-bubble-never', this.config.showValue === 'never');
  }

  // ---- painting -----------------------------------------------------------------------------

  private pct(v: number): number {
    return this.max === this.min ? 0 : ((v - this.min) / (this.max - this.min)) * 100;
  }

  protected applyValue(v: V): void {
    const vals = Array.isArray(v) ? v : [v];
    this.knobs.forEach((k, i) => {
      const x = vals[i] ?? vals[0];
      k.style.left = `${this.pct(x)}%`;
      k.setAttribute('aria-valuemin', String(i === 1 ? vals[0] : this.min));
      k.setAttribute('aria-valuemax', String(i === 0 && this.isRange ? vals[1] : this.max));
      k.setAttribute('aria-valuenow', String(x));
      k.setAttribute('aria-valuetext', this.fmt(x));
      this.bubbles[i].textContent = this.fmt(x);
    });
    const lo = this.isRange ? this.pct(vals[0]) : 0;
    const hi = this.pct(this.isRange ? vals[1] : vals[0]);
    this.fill.style.left = `${lo}%`;
    this.fill.style.width = `${Math.max(0, hi - lo)}%`;
  }

  private paintMarks() {
    const m = this.config.marks;
    this.marksEl.replaceChildren();
    if (!m) return;
    const list: SliderMark[] = Array.isArray(m) ? m : (() => {
      const n = Math.floor((this.max - this.min) / this.step);
      const every = Math.ceil(n / 20) || 1;
      return Array.from({ length: Math.floor(n / every) + 1 }, (_, i) => ({ value: this.min + i * every * this.step }));
    })();
    for (const mk of list) {
      const tick = h('span', 'op-slider__mark', {}, mk.label ? h('span', 'op-slider__mark-label', {}, mk.label) : '');
      tick.style.left = `${this.pct(mk.value)}%`;
      this.marksEl.append(tick);
    }
  }

  // ---- pointer ------------------------------------------------------------------------------

  private valueAt(e: PointerEvent): number {
    const r = this.track.getBoundingClientRect();
    return this.snap(this.min + Math.max(0, Math.min(1, (e.clientX - r.left) / (r.width || 1))) * (this.max - this.min));
  }

  private nearest(v: number): number {
    if (!this.isRange) return 0;
    const [a, b] = this.vals();
    return Math.abs(v - a) <= Math.abs(v - b) ? (v > b ? 1 : 0) : 1;
  }

  private onTrackDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('.op-slider__knob') || this.config.disabled || this.config.readonly || e.button) return;
    const i = this.nearest(this.valueAt(e));
    this.onKnobDown(e, i);
  }

  private onKnobDown(e: PointerEvent, i: number) {
    if (this.config.disabled || this.config.readonly || e.button) return;
    e.preventDefault();
    const knob = this.knobs[i];
    knob.focus();
    knob.setPointerCapture?.(e.pointerId);
    this.el.classList.add('is-dragging');
    this.emit('slide-start');
    const stretch = knobStretch(knob, 'x');
    let prev = e.clientX;
    this.setAt(i, this.valueAt(e));
    const move = (m: PointerEvent) => {
      stretch.move(m.clientX - prev);
      prev = m.clientX;
      this.setAt(i, this.valueAt(m));
    };
    const up = () => {
      knob.removeEventListener('pointermove', move);
      knob.removeEventListener('pointerup', up);
      knob.removeEventListener('pointercancel', up);
      this.el.classList.remove('is-dragging');
      stretch.release();
      (this.flushSettled(), this.emit('slide-end', this.value));
    };
    knob.addEventListener('pointermove', move);
    knob.addEventListener('pointerup', up);
    knob.addEventListener('pointercancel', up);
    this.own(up);
  }

  /** The user moved knob `i` to `v`: update the value (knobs of a range never cross) and tell everyone. */
  private setAt(i: number, v: number) {
    const vals = this.vals();
    if (this.isRange) vals[i] = i === 0 ? Math.min(v, vals[1]) : Math.max(v, vals[0]);
    else vals[0] = v;
    const next: V = this.isRange ? ([vals[0], vals[1]] as [number, number]) : vals[0];
    if (this.isEqual(next, this.value)) return;
    this.commit(next);
    this.applyValue(next);
  }

  private onKey(e: KeyboardEvent, i: number) {
    if (this.config.disabled || this.config.readonly) return;
    const vals = this.vals();
    const cur = vals[i];
    const big = this.step * 10;
    const lo = this.isRange && i === 1 ? vals[0] : this.min;
    const hi = this.isRange && i === 0 ? vals[1] : this.max;
    const to: Record<string, number> = { ArrowRight: cur + this.step, ArrowUp: cur + this.step, ArrowLeft: cur - this.step, ArrowDown: cur - this.step, PageUp: cur + big, PageDown: cur - big, Home: lo, End: hi };
    if (!(e.key in to)) return;
    e.preventDefault();
    this.setAt(i, Math.max(lo, Math.min(hi, this.snap(to[e.key]))));
    (this.flushSettled(), this.emit('slide-end', this.value));
  }

  // ---- API ----------------------------------------------------------------------------------

  /** Where the (first) knob is, 0–100. */
  getPercent(): number {
    return this.pct(this.vals()[0]);
  }

  private refresh() {
    if (!this.rendered) return;
    this.applyValue(this.value);
    this.paintMarks();
  }

  setMin(min: number) {
    this.config.min = min;
    this.value = this.clampAll(this.value);
    this.refresh();
  }
  setMax(max: number) {
    this.config.max = max;
    this.value = this.clampAll(this.value);
    this.refresh();
  }
  setStep(step: number) {
    this.config.step = step;
    this.value = this.clampAll(this.value);
    this.refresh();
  }
  private clampAll(v: V): V {
    return Array.isArray(v) ? ([this.snap(v[0]), this.snap(v[1])] as [number, number]) : this.snap(v);
  }

  /** Switches between one knob and two; the value is converted. */
  setRange(range: boolean) {
    if (range === this.isRange) return;
    const v = this.vals();
    this.config.range = range;
    this.value = range ? [v[0], this.max] : v[0];
    if (!this.rendered) return;
    this.buildKnobs();
    this.inputEl = this.knobs[0];
    this.applyValue(this.value);
  }

  protected override onDisabled(disabled: boolean) {
    this.knobs.forEach((k) => ((k.tabIndex = disabled ? -1 : 0), k.setAttribute('aria-disabled', String(disabled))));
  }
  protected override onReadonly(readonly: boolean) {
    this.knobs.forEach((k) => k.setAttribute('aria-readonly', String(readonly)));
  }
}
register('slider', Slider);
