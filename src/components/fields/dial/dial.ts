import { Field, type FieldConfig } from '../../../core/field';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { motion } from '../../../motion/config';
import { rubberBand } from '../../../motion/extras';

export type DialValue = number | string;
export interface DialOption {
  value: DialValue;
  label?: string;
}

export interface DialConfig extends FieldConfig<DialValue> {
  min?: number;
  max?: number;
  step?: number;
  /** A list instead of a range: the value is the item's value. */
  options?: (DialValue | DialOption)[];
  /** Snap points: every multiple of N (a range, default 10), every N items (a list, default 1), explicit values, or none. */
  snap?: number | DialValue[] | false;
  shape?: 'linear' | 'circle';
  format?: (v: DialValue) => string;
  /** Which ticks get a label. Default `snap`. */
  labels?: 'snap' | 'all' | 'none';
}

interface Item {
  value: DialValue;
  label: string;
  major: boolean;
}

const FLICK = 0.35; // px/ms: faster than this on release is a flick, which glides to a snap point
const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

/** A flat ruler (or a clock face) to pick one value from a range or a list, with a rolling readout. */
export class Dial extends Field<DialValue, DialConfig> {
  protected override baseCls = 'op-field op-dial';
  private face!: HTMLElement;
  private tape!: HTMLElement;
  private needle!: HTMLElement;
  private readout!: HTMLElement;
  private cache?: Item[];
  /** Where the ruler sits, as an item index (fractional while dragging). */
  private pos = 0;
  /** The hand's angle in circle mode, kept continuous so it always turns the short way. */
  private angle = 0;
  private shown = '';
  private stopGlide?: () => void;

  constructor(config: DialConfig = {}) {
    super(config);
    this.value = this.original = this.normalize(this.value);
  }

  private get isCircle() {
    return this.config.shape === 'circle';
  }
  private get items(): Item[] {
    return (this.cache ??= this.buildItems());
  }

  private fmt(v: DialValue): string {
    return this.config.format ? this.config.format(v) : String(v);
  }

  private buildItems(): Item[] {
    const c = this.config;
    let base: { value: DialValue; label?: string }[];
    if (c.options) base = c.options.map((o) => (typeof o === 'object' ? o : { value: o }));
    else {
      const min = c.min ?? 0;
      const step = c.step || 1;
      const n = Math.max(1, Math.floor(((c.max ?? 100) - min) / step + 1e-9) + 1);
      const dec = Math.max(decimals(step), decimals(min));
      base = Array.from({ length: n }, (_, i) => ({ value: Number((min + i * step).toFixed(dec)) }));
    }
    const snap = c.snap ?? (c.options ? 1 : 10);
    const major = (v: DialValue, i: number) =>
      snap === false ? false : Array.isArray(snap) ? snap.includes(v) : c.options ? i % snap === 0 : Math.abs((v as number) / snap - Math.round((v as number) / snap)) < 1e-9;
    return base.map((o, i) => ({ value: o.value, label: o.label ?? this.fmt(o.value), major: major(o.value, i) }));
  }

  protected override emptyValue(): DialValue {
    const first = this.config.options?.[0];
    return first === undefined ? (this.config.min ?? 0) : typeof first === 'object' ? first.value : first;
  }
  protected override isEmpty(): boolean {
    return false;
  }

  private indexOf(v: DialValue): number {
    const list = this.items;
    if (this.config.options) return Math.max(0, list.findIndex((it) => it.value === v));
    const i = Math.round(((v as number) - (this.config.min ?? 0)) / (this.config.step || 1));
    return Math.max(0, Math.min(list.length - 1, Number.isFinite(i) ? i : 0));
  }
  private normalize(v: DialValue): DialValue {
    return this.items[this.indexOf(v)].value;
  }
  private get index(): number {
    return this.indexOf(this.value);
  }

  // ---- DOM ----------------------------------------------------------------------------------

  protected createControl() {
    this.readout = h('div', 'op-dial__readout', { 'aria-hidden': 'true' });
    this.tape = h('div', 'op-dial__tape');
    this.needle = h('div', 'op-dial__needle');
    this.face = h('div', 'op-dial__face', { role: 'slider', tabindex: 0, 'aria-orientation': 'horizontal' }, h('div', 'op-dial__window', {}, this.tape), this.needle);
    this.listen(this.face, 'pointerdown', (e: PointerEvent) => this.onDown(e));
    this.listen(this.face, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.paintTicks();
    this.inputEl = this.face;
    return h('div', 'op-dial__box', {}, this.readout, this.face);
  }

  protected override onRender() {
    super.onRender();
    const label = this.el.querySelector('.op-field__label') as HTMLElement;
    label.id = `${this.id}-label`;
    if (!this.config.ariaLabel) this.face.setAttribute('aria-labelledby', label.id);
  }

  private paintTicks() {
    const list = this.items;
    const show = this.config.labels ?? 'snap';
    if (this.rendered) {
      this.el.classList.toggle('op-dial--circle', this.isCircle);
      this.el.classList.toggle('op-dial--list', !!this.config.options);
    }
    this.tape.replaceChildren(
      ...list.map((it, i) => {
        const tick = h('span', `op-dial__tick${it.major ? ' is-major' : ''}`, { 'data-i': i });
        tick.style.setProperty('--i', String(i));
        tick.style.setProperty('--a', `${(i * 360) / list.length}deg`);
        if (show === 'all' || (show === 'snap' && it.major)) tick.append(h('span', 'op-dial__tick-label', {}, it.label));
        return tick;
      }),
    );
  }

  protected override build(): HTMLElement {
    const el = super.build();
    el.classList.toggle('op-dial--circle', this.isCircle);
    el.classList.toggle('op-dial--list', !!this.config.options);
    return el;
  }

  /** Distance in px between two ticks on the ruler, for drags (12 when there is no layout, as in tests). */
  private spacing(): number {
    const [a, b] = this.tape.children as unknown as HTMLElement[];
    return (b && a && b.offsetLeft - a.offsetLeft) || 12;
  }

  private place() {
    this.needle.style.transform = this.isCircle ? `translateX(-50%) rotate(${this.angle}deg)` : '';
    this.tape.style.setProperty('--pos', String(this.isCircle ? 0 : this.pos));
  }

  /** Turns the hand to item `i` the short way round. */
  private aim(i: number) {
    const target = (i * 360) / this.items.length;
    this.angle += ((((target - this.angle) % 360) + 540) % 360) - 180;
  }

  protected applyValue(v: DialValue): void {
    const i = this.indexOf(v);
    this.pos = i;
    this.aim(i);
    this.place();
    this.paintState(i);
  }

  /** ARIA, the current tick and the readout for item `i`. */
  private paintState(i: number) {
    const list = this.items;
    const it = list[i];
    const f = this.face;
    const isList = !!this.config.options;
    f.setAttribute('aria-valuemin', String(isList ? 0 : list[0].value));
    f.setAttribute('aria-valuemax', String(isList ? list.length - 1 : list[list.length - 1].value));
    f.setAttribute('aria-valuenow', String(isList ? i : it.value));
    f.setAttribute('aria-valuetext', it.label);
    this.tape.querySelector('.is-current')?.classList.remove('is-current');
    this.tape.children[i]?.classList.add('is-current');
    this.paintReadout(it.label);
  }

  /** Digits roll like an odometer when the text keeps its shape; any other change slides the new text in. */
  private paintReadout(text: string) {
    const old = this.shown;
    if (text === old) return;
    this.shown = text;
    const shape = (s: string) => s.replace(/\d/g, '0');
    if (old && shape(old) === shape(text)) {
      [...text].forEach((ch, k) => /\d/.test(ch) && (this.readout.children[k] as HTMLElement).firstElementChild!.setAttribute('style', `--d:${ch}`));
      return;
    }
    this.readout.replaceChildren(
      ...[...text].map((ch) =>
        /\d/.test(ch)
          ? h('span', 'op-dial__digit', {}, h('span', 'op-dial__reel', { style: `--d:${ch}` }, ...'0123456789'.split('').map((d) => h('span', '', {}, d))))
          : h('span', '', {}, ch),
      ),
    );
    if (old && motion.isOn() && typeof this.readout.animate === 'function') {
      const up = this.items.findIndex((it) => it.label === text) >= this.items.findIndex((it) => it.label === old);
      // `translate`, not `transform`: the circle centers the readout with a transform
      this.readout.animate([{ translate: `0 ${up ? 35 : -35}%`, opacity: 0 }, { translate: '0 0', opacity: 1 }], { duration: motion.ms('swap'), easing: motion.easing('enter') });
    }
  }

  // ---- user input ---------------------------------------------------------------------------

  /** The user picked item `i`: animate there and tell everyone. */
  private choose(i: number) {
    const list = this.items;
    i = Math.max(0, Math.min(list.length - 1, i));
    this.pos = i;
    this.aim(i);
    this.place();
    this.paintState(i);
    this.commit(list[i].value);
  }

  private get locked() {
    return !!(this.config.disabled || this.config.readonly);
  }

  private onKey(e: KeyboardEvent) {
    if (this.locked) return;
    const i = this.index;
    const n = this.items.length;
    const to: Record<string, number> = { ArrowRight: i + 1, ArrowUp: i + 1, ArrowLeft: i - 1, ArrowDown: i - 1, PageUp: this.snapFrom(i, 1), PageDown: this.snapFrom(i, -1), Home: 0, End: n - 1 };
    if (!(e.key in to)) return;
    e.preventDefault();
    this.choose(to[e.key]);
    (this.flushSettled(), this.emit('slide-end', this.value));
  }

  /** The next snap point after item `i` in direction `dir` (or the limit when there is none). */
  private snapFrom(i: number, dir: 1 | -1): number {
    const list = this.items;
    for (let k = i + dir; k >= 0 && k < list.length; k += dir) if (list[k].major) return k;
    return dir > 0 ? list.length - 1 : 0;
  }

  private angleAt(e: PointerEvent): number {
    const r = this.face.getBoundingClientRect();
    const a = (Math.atan2(e.clientX - (r.left + r.width / 2), (r.top + r.height / 2) - e.clientY) * 180) / Math.PI;
    return (a + 360) % 360;
  }

  private onDown(e: PointerEvent) {
    if (this.locked || e.button) return;
    e.preventDefault();
    this.stopGlide?.();
    const f = this.face;
    f.focus();
    f.setPointerCapture?.(e.pointerId);
    const n = this.items.length;
    const sp = this.spacing();
    const x0 = e.clientX;
    const p0 = this.pos;
    let moved = false;
    let samples = [{ x: e.clientX, t: e.timeStamp }];
    this.el.classList.add('is-dragging');
    this.emit('slide-start');
    const follow = (m: PointerEvent) => {
      if (this.isCircle) {
        const a = this.angleAt(m);
        this.angle += ((((a - this.angle) % 360) + 540) % 360) - 180;
        this.place();
        return Math.round((a / 360) * n) % n;
      }
      const raw = p0 - (m.clientX - x0) / sp;
      const over = raw < 0 ? raw : raw > n - 1 ? raw - (n - 1) : 0;
      this.pos = over ? raw - over + (Math.sign(over) * rubberBand(Math.abs(over) * sp, sp * 2)) / sp : raw;
      this.place();
      return Math.round(Math.max(0, Math.min(n - 1, raw)));
    };
    const track = (m: PointerEvent) => {
      if (Math.abs(m.clientX - x0) > 3 || this.isCircle) moved = true;
      samples = [...samples.filter((s) => m.timeStamp - s.t < 100), { x: m.clientX, t: m.timeStamp }];
      const i = follow(m);
      if (i !== this.index) (this.paintState(i), this.commit(this.items[i].value));
    };
    const detach = () => {
      f.removeEventListener('pointermove', track);
      f.removeEventListener('pointerup', up);
      f.removeEventListener('pointercancel', up);
    };
    const up = (u: PointerEvent) => {
      detach();
      this.el.classList.remove('is-dragging');
      if (u.type === 'pointercancel') return this.rest(this.index);
      if (this.isCircle) return this.rest(moved ? this.index : Math.round((this.angleAt(u) / 360) * n) % n);
      if (!moved) {
        // a click: go to the tick under the pointer
        const r = f.getBoundingClientRect();
        return this.rest(Math.round(this.pos + (u.clientX - (r.left + r.width / 2)) / sp));
      }
      const first = samples[0];
      const v = (u.clientX - first.x) / Math.max(1, u.timeStamp - first.t); // px/ms, > 0 = towards the start
      if (Math.abs(v) < FLICK) return this.rest(Math.round(Math.max(0, Math.min(n - 1, this.pos))));
      const dir = v < 0 ? 1 : -1;
      const ahead = this.pos + (dir * Math.abs(v) * 260) / sp; // where the inertia would carry it
      // rest on the snap point nearest to that, among those ahead of the ruler (or on the nearest step when there are none)
      let to = -1;
      this.items.forEach((it, k) => it.major && (dir > 0 ? k > this.pos : k < this.pos) && (to < 0 || Math.abs(k - ahead) < Math.abs(to - ahead)) && (to = k));
      this.rest(to >= 0 ? to : Math.round(Math.max(0, Math.min(n - 1, ahead))), true);
    };
    f.addEventListener('pointermove', track);
    f.addEventListener('pointerup', up);
    f.addEventListener('pointercancel', up);
    this.own(detach);
  }

  /** Comes to rest on item `i`; a glide (after a flick) takes longer the further it goes. */
  private rest(i: number, glide = false) {
    const from = this.pos;
    this.choose(i);
    const end = () => {
      this.stopGlide = undefined;
      this.el.classList.remove('is-gliding');
      this.tape.style.transitionDuration = '';
      (this.flushSettled(), this.emit('slide-end', this.value));
    };
    if (!glide || !motion.isOn()) return end();
    const ms = Math.min(900, 280 + Math.abs(this.pos - from) * this.spacing() * 0.9);
    this.el.classList.add('is-gliding');
    this.tape.style.transitionDuration = `${ms}ms`;
    this.stopGlide = this.later(end, ms);
  }

  // ---- API ----------------------------------------------------------------------------------

  /** Moves `n` steps (negative goes back). */
  next(n = 1) {
    this.setValue(this.items[Math.max(0, Math.min(this.items.length - 1, this.index + n))].value);
  }
  prev(n = 1) {
    this.next(-n);
  }
  nextSnap() {
    this.setValue(this.items[this.snapFrom(this.index, 1)].value);
  }
  prevSnap() {
    this.setValue(this.items[this.snapFrom(this.index, -1)].value);
  }

  override getDisplayText(): string {
    return this.items[this.index].label;
  }

  private rebuild(patch: Partial<DialConfig>) {
    Object.assign(this.config, patch);
    this.cache = undefined;
    this.value = this.normalize(this.value);
    if (!this.rendered) return;
    this.paintTicks();
    this.shown = '';
    this.readout.replaceChildren();
    this.applyValue(this.value);
  }
  setMin(min: number) {
    this.rebuild({ min });
  }
  setMax(max: number) {
    this.rebuild({ max });
  }
  setStep(step: number) {
    this.rebuild({ step });
  }
  setOptions(options: DialConfig['options']) {
    this.rebuild({ options });
  }
  setSnap(snap: DialConfig['snap']) {
    this.rebuild({ snap });
  }
  setShape(shape: 'linear' | 'circle') {
    this.rebuild({ shape });
  }
  setFormat(format: DialConfig['format']) {
    this.rebuild({ format });
  }

  protected override onDisabled(disabled: boolean) {
    this.face.tabIndex = disabled ? -1 : 0;
    this.face.setAttribute('aria-disabled', String(disabled));
  }
  protected override onReadonly(readonly: boolean) {
    this.face.setAttribute('aria-readonly', String(readonly));
  }
}
register('dial', Dial);
