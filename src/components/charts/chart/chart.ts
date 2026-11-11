import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { format, type Formatter } from '../../../data/format';
import type { Store } from '../../../data/store';

addMessages('en', { chart: 'Chart', chartPercent: '{n}%' });
addMessages('pt-BR', { chart: 'Gráfico', chartPercent: '{n}%' });

export interface ChartSeries {
  /** Record field with the value. */
  field: string;
  /** Name in the legend and tooltip. Default: the field. */
  label?: string;
  /** Any CSS color. Default: the theme's `--op-chart-N` in order. */
  color?: string;
}

export interface ChartConfig extends ComponentConfig {
  kind?: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'sparkline';
  /** Records. Give `data` or a `store` (any change of the store repaints the chart). */
  data?: Array<Record<string, any>>;
  store?: Store<any>;
  /** Field with the category: the x axis, or the name of each slice. */
  x: string;
  /** Series to draw (a field name, or an object). A pie and a donut draw the first one. */
  series: Array<string | ChartSeries>;
  /** `bar` and `area` pile the series up instead of putting them side by side. */
  stacked?: boolean;
  /** Default: shown when there is more than one series, or for a pie. */
  legend?: boolean;
  /** Name of a registered format (`money`, `number`, `percent`...) or a function, for the axis and the tooltip. Default `number`. */
  format?: string | Formatter;
  /** Accessible name; also the caption of the data table read by screen readers. */
  title?: string;
  /** Height in px. Default 240 (sparkline 36). */
  height?: number;
}

const NS = 'http://www.w3.org/2000/svg';
// the first series follows the theme's primary color unless the theme sets `--op-chart-1` (a var() resolved at :root would ignore a scoped theme)
const tone = (i: number) => (i % 8 ? `var(--op-chart-${(i % 8) + 1})` : 'var(--op-chart-1, var(--op-color-primary))');
type Pt = { label: string; value: number; color: string; idx: number };

function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, cls = ''): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  if (cls) el.setAttribute('class', cls);
  for (const k in attrs) el.setAttribute(k, String(attrs[k]));
  return el;
}

/** Round tick values from `min` to above `max`, about `n` of them. */
function ticks(min: number, max: number, n = 4): number[] {
  const span = max - min || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out: number[] = [];
  for (let v = Math.floor(min / step) * step; v < max + step * 0.999; v += step) out.push(Math.round(v / step) * step);
  return out;
}

/** Bar, line, area, pie, donut and sparkline charts in SVG. Colors come from the theme (`--op-chart-1`...), so dark mode and white-label just work. */
export class Chart extends Component<ChartConfig> {
  protected override baseCls = 'op-chart';
  private svg!: SVGSVGElement;
  private plot!: HTMLElement;
  private tip!: HTMLElement;
  private legendEl!: HTMLElement;
  private sr!: HTMLTableElement;
  private hidden = new Set<number>();
  private rows: Array<Record<string, any>> = [];
  private active = -1;
  private geom: { left: number; band: number; top: number; bottom: number; n: number } | undefined;
  private queued = false;
  private offStore?: () => void;

  protected override build() {
    this.svg = s('svg', { role: 'img', tabindex: 0, preserveAspectRatio: 'xMidYMid meet' }, 'op-chart__svg') as SVGSVGElement;
    this.tip = h('div', 'op-chart__tip', { role: 'status' });
    this.tip.hidden = true;
    this.plot = h('div', 'op-chart__plot', {}, this.svg, this.tip);
    this.legendEl = h('div', 'op-chart__legend');
    this.sr = h('table', 'op-sr-only');
    return h('div', this.baseCls, {}, this.plot, this.legendEl, this.sr);
  }

  protected override onRender() {
    const c = this.config;
    this.el.classList.add(`op-chart--${c.kind ?? 'bar'}`);
    if (c.store) this.bindStore(c.store);
    this.setData(c.data ?? []);
    this.listen(this.svg, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.listen(this.svg, 'blur', () => this.activate(-1));
    this.listen(this.svg, 'pointerleave', () => this.activate(-1));
    if (typeof ResizeObserver === 'function') {
      let last = 0;
      const ro = new ResizeObserver(() => this.plot.clientWidth !== last && ((last = this.plot.clientWidth), this.paint()));
      ro.observe(this.plot);
      this.own(() => ro.disconnect());
    }
  }

  private bindStore(store: Store<any>) {
    this.offStore?.();
    this.config.store = store;
    // a burst of live patches paints once
    this.offStore = store.subscribe(() => {
      if (this.queued) return;
      this.queued = true;
      queueMicrotask(() => ((this.queued = false), this.rendered && !this.destroyed && this.setData(store.getFiltered().map((r) => r.data))));
    });
    this.own(() => this.offStore?.());
  }

  setStore(store: Store<any>) {
    this.bindStore(store);
    if (this.rendered) this.setData(store.getFiltered().map((r) => r.data));
  }

  setData(data: Array<Record<string, any>>) {
    this.rows = data;
    if (this.rendered) this.paint();
  }

  setKind(kind: NonNullable<ChartConfig['kind']>) {
    this.el.classList.remove(`op-chart--${this.config.kind ?? 'bar'}`);
    this.config.kind = kind;
    this.el.classList.add(`op-chart--${kind}`);
    this.paint();
  }

  setSeries(series: ChartConfig['series']) {
    this.config.series = series;
    this.hidden.clear();
    this.paint();
  }

  // ---- model ----------------------------------------------------------------------------------

  private series(): Array<Required<Pick<ChartSeries, 'field' | 'label'>> & { color: string; idx: number }> {
    return this.config.series.map((x, idx) => {
      const o = typeof x === 'string' ? { field: x } : x;
      return { field: o.field, label: o.label ?? o.field, color: o.color ?? tone(idx), idx };
    });
  }

  private fmt(v: number): string {
    return format(this.config.format ?? 'number', v);
  }

  private isPie() {
    return this.config.kind === 'pie' || this.config.kind === 'donut';
  }

  private slices(): Pt[] {
    const f = this.series()[0].field;
    return this.rows.map((r, idx) => ({ label: String(r[this.config.x] ?? ''), value: Math.max(0, Number(r[f]) || 0), color: tone(idx), idx }));
  }

  // ---- painting -------------------------------------------------------------------------------

  private paint() {
    if (!this.rendered) return;
    const c = this.config;
    const kind = c.kind ?? 'bar';
    const spark = kind === 'sparkline';
    const W = Math.max(this.plot.clientWidth, 0) || 600;
    const H = c.height ?? (spark ? 36 : 240);
    this.svg.replaceChildren();
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.style.height = `${H}px`;
    this.svg.setAttribute('aria-label', c.title ?? t('chart'));
    this.geom = undefined;
    this.active = -1;
    this.tip.hidden = true;
    if (!this.rows.length || !c.series.length) {
      this.svg.append(Object.assign(s('text', { x: W / 2, y: H / 2, 'text-anchor': 'middle' }, 'op-chart__empty'), { textContent: t('empty') }));
    } else if (this.isPie()) this.paintPie(W, H);
    else this.paintXY(W, H, kind as 'bar' | 'line' | 'area' | 'sparkline');
    this.paintLegend();
    this.paintTable();
  }

  private paintXY(W: number, H: number, kind: 'bar' | 'line' | 'area' | 'sparkline') {
    const c = this.config;
    const spark = kind === 'sparkline';
    const ser = this.series().filter((x) => !this.hidden.has(x.idx));
    const n = this.rows.length;
    const vals = ser.map((x) => this.rows.map((r) => Number(r[x.field]) || 0));
    const stack = !!c.stacked && (kind === 'bar' || kind === 'area');
    const base = vals.map((v, i) => v.map((_, j) => (stack ? vals.slice(0, i).reduce((a, w) => a + w[j], 0) : 0)));
    const tops = vals.map((v, i) => v.map((x, j) => x + base[i][j]));
    const all = tops.flat();
    const lo = kind === 'line' || spark ? Math.min(0, ...all) : 0;
    const hi = Math.max(...all, 0);
    const ts = spark ? [lo, hi] : ticks(lo, hi);
    const yMin = ts[0];
    const yMax = ts[ts.length - 1] || 1;
    const left = spark ? 2 : Math.max(...ts.map((v) => this.fmt(v).length)) * 6.5 + 12;
    const right = spark ? 2 : 8;
    const top = spark ? 3 : 8;
    const bottom = spark ? H - 3 : H - 24;
    const band = (W - left - right) / n;
    const y = (v: number) => bottom - ((v - yMin) / (yMax - yMin || 1)) * (bottom - top);
    const xc = (j: number) => left + band * (j + 0.5);
    this.geom = { left, band, top, bottom, n };

    if (!spark) {
      const grid = s('g', {}, 'op-chart__grid');
      for (const v of ts) {
        grid.append(s('line', { x1: left, x2: W - right, y1: y(v), y2: y(v) }, v === 0 ? 'op-chart__axis' : ''));
        grid.append(Object.assign(s('text', { x: left - 6, y: y(v), 'text-anchor': 'end', dy: '0.32em' }, 'op-chart__tick'), { textContent: this.fmt(v) }));
      }
      const step = Math.ceil(48 / band);
      this.rows.forEach((r, j) => j % step === 0 && grid.append(Object.assign(s('text', { x: xc(j), y: H - 7, 'text-anchor': 'middle' }, 'op-chart__tick'), { textContent: String(r[c.x] ?? '') })));
      this.svg.append(grid);
    }

    const marks = s('g', {}, 'op-chart__marks');
    ser.forEach((x, k) => {
      const g = s('g', { style: `--op-chart-c:${x.color}` }, 'op-chart__series');
      if (kind === 'bar') {
        const slot = (band * 0.7) / (stack ? 1 : ser.length);
        vals[k].forEach((v, j) => {
          const x0 = xc(j) - (band * 0.7) / 2 + (stack ? 0 : k * slot);
          const y0 = y(tops[k][j]);
          g.append(s('rect', { x: x0, y: Math.min(y0, y(base[k][j])), width: Math.max(slot - (stack ? 0 : 1), 1), height: Math.abs(y(base[k][j]) - y0), rx: 2 }, 'op-chart__bar'));
        });
      } else {
        const line = tops[k].map((v, j) => `${j ? 'L' : 'M'}${xc(j).toFixed(1)} ${y(v).toFixed(1)}`).join('');
        if (kind !== 'line') {
          const back = stack ? base[k].map((v, j) => `L${xc(n - 1 - j).toFixed(1)} ${y(base[k][n - 1 - j]).toFixed(1)}`).join('') : `L${xc(n - 1)} ${y(0)}L${xc(0)} ${y(0)}`;
          g.append(s('path', { d: `${line}${back}Z` }, 'op-chart__area'));
        }
        g.append(s('path', { d: line }, 'op-chart__line'));
        if (spark || n <= 40) {
          const pts = spark ? [n - 1] : tops[k].map((_, j) => j);
          for (const j of pts) g.append(s('circle', { cx: xc(j), cy: y(tops[k][j]), r: spark ? 2.5 : 3 }, 'op-chart__dot'));
        }
      }
      marks.append(g);
    });
    this.svg.append(marks);
    this.svg.append(s('line', { y1: top, y2: bottom, x1: 0, x2: 0 }, 'op-chart__guide'));

    // one transparent band per category: hover, touch and the tooltip live here, not on tiny marks
    const hits = s('g');
    for (let j = 0; j < n; j++) {
      const r = s('rect', { x: left + band * j, y: 0, width: band, height: H }, 'op-chart__hit');
      r.addEventListener('pointerenter', () => this.activate(j));
      r.addEventListener('pointerdown', () => this.activate(j));
      hits.append(r);
    }
    this.svg.append(hits);
  }

  private paintPie(W: number, H: number) {
    const slices = this.slices().filter((p) => !this.hidden.has(p.idx));
    const total = slices.reduce((a, p) => a + p.value, 0) || 1;
    const R = Math.min(W, H) / 2 - 6;
    const r0 = this.config.kind === 'donut' ? R * 0.6 : 0;
    const [cx, cy] = [W / 2, H / 2];
    const pt = (a: number, r: number) => `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`;
    let a0 = 0;
    for (const p of slices) {
      const a1 = a0 + Math.min((p.value / total) * Math.PI * 2, Math.PI * 2 - 0.0001);
      const big = a1 - a0 > Math.PI ? 1 : 0;
      const d = `M${pt(a0, R)}A${R} ${R} 0 ${big} 1 ${pt(a1, R)}` + (r0 ? `L${pt(a1, r0)}A${r0} ${r0} 0 ${big} 0 ${pt(a0, r0)}Z` : `L${cx} ${cy}Z`);
      const path = s('path', { d, style: `--op-chart-c:${p.color}` }, 'op-chart__slice');
      path.addEventListener('pointerenter', () => this.activate(p.idx));
      this.svg.append(path);
      a0 = a1;
    }
    if (r0) this.svg.append(Object.assign(s('text', { x: cx, y: cy, 'text-anchor': 'middle', dy: '0.32em' }, 'op-chart__total'), { textContent: this.fmt(total) }));
  }

  private paintLegend() {
    const c = this.config;
    const items = this.isPie() ? this.slices().map((p) => ({ label: p.label, color: p.color, idx: p.idx })) : this.series();
    this.legendEl.hidden = !(c.legend ?? (this.isPie() || items.length > 1)) || c.kind === 'sparkline' || !this.rows.length;
    this.legendEl.replaceChildren(
      ...items.map((x) => {
        const b = h('button', `op-chart__key${this.hidden.has(x.idx) ? ' is-off' : ''}`, { type: 'button', 'aria-pressed': String(!this.hidden.has(x.idx)) }, h('span', 'op-chart__swatch'), x.label);
        b.style.setProperty('--op-chart-c', x.color);
        b.addEventListener('click', () => (this.hidden.has(x.idx) ? this.hidden.delete(x.idx) : this.hidden.add(x.idx), this.paint()));
        return b;
      }),
    );
  }

  private paintTable() {
    const c = this.config;
    const ser = this.series();
    this.sr.replaceChildren(
      Object.assign(h('caption'), { textContent: c.title ?? '' }),
      h('thead', '', {}, h('tr', '', {}, h('th', '', {}, c.x), ...ser.map((x) => h('th', '', {}, x.label)))),
      h('tbody', '', {}, ...this.rows.map((r) => h('tr', '', {}, h('td', '', {}, String(r[c.x] ?? '')), ...ser.map((x) => h('td', '', {}, this.fmt(Number(r[x.field]) || 0)))))),
    );
  }

  // ---- tooltip --------------------------------------------------------------------------------

  private activate(j: number) {
    this.active = j;
    const g = this.geom;
    const guide = this.svg.querySelector<SVGLineElement>('.op-chart__guide');
    this.svg.querySelectorAll('.op-chart__slice').forEach((el, k) => el.classList.toggle('is-active', this.slices().filter((p) => !this.hidden.has(p.idx))[k]?.idx === j));
    if (j < 0 || !this.rows[j]) return void (this.tip.hidden = true, guide?.classList.remove('is-on'));
    const c = this.config;
    const rows: Array<[string, string, string]> = [];
    let head = String(this.rows[j][c.x] ?? '');
    let x: number;
    if (this.isPie()) {
      const p = this.slices()[j];
      const total = this.slices().filter((q) => !this.hidden.has(q.idx)).reduce((a, q) => a + q.value, 0) || 1;
      rows.push([p.color, this.fmt(p.value), t('chartPercent', { n: Math.round((p.value / total) * 100) })]);
      x = this.plot.clientWidth / 2;
    } else {
      for (const sr of this.series().filter((q) => !this.hidden.has(q.idx))) rows.push([sr.color, sr.label, this.fmt(Number(this.rows[j][sr.field]) || 0)]);
      x = g ? g.left + g.band * (j + 0.5) : 0;
      if (guide && g) (guide.setAttribute('x1', String(x)), guide.setAttribute('x2', String(x)), guide.classList.add('is-on'));
    }
    this.tip.replaceChildren(h('div', 'op-chart__tip-head', {}, head), ...rows.map(([color, a, b]) => { const r = h('div', 'op-chart__tip-row', {}, h('span', 'op-chart__swatch'), h('span', '', {}, a), h('b', '', {}, b)); r.style.setProperty('--op-chart-c', color); return r; }));
    this.tip.hidden = false;
    this.tip.classList.toggle('is-left', x > this.plot.clientWidth / 2);
    this.tip.style.left = `${x}px`;
    this.emit('point', this.rows[j], j);
  }

  private onKey(e: KeyboardEvent) {
    const n = this.rows.length;
    const next = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? this.active + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? this.active - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : e.key === 'Escape' ? -1 : undefined;
    if (next === undefined) return;
    e.preventDefault();
    this.activate(Math.max(-1, Math.min(n - 1, next)));
  }
}
register('chart', Chart);
