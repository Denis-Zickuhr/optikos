import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, getLocale, addMessages } from '../../../core/i18n';
import type { Store } from '../../../data/store';
import { iconEl } from '../../base/icon/icon';

addMessages('en', { timeline: 'Timeline', tlNow: 'Now', tlFromTo: '{from} to {to}' });
addMessages('pt-BR', { timeline: 'Linha do tempo', tlNow: 'Agora', tlFromTo: '{from} até {to}' });

export interface TimelineItem {
  id?: string | number;
  title: string;
  text?: string;
  icon?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** `list`: when it happened (an ISO date or time, or any text). */
  time?: string;
  /** `range`: ISO dates or date-times. */
  start?: string;
  end?: string;
  /** `range`: the row (a person, a room, a phase). */
  lane?: string;
}

export interface TimelineConfig extends ComponentConfig {
  /** `list`: events one under the other, with a marker (default). `range`: a schedule: bars over a time axis, one row per `lane`. */
  mode?: 'list' | 'range';
  items?: TimelineItem[];
  /** Items from a Store (its records are `TimelineItem`s). */
  store?: Store<any>;
  /** `range`: the order of the rows. Default: order of appearance. */
  lanes?: string[];
  /** `range`: the window shown. Default: from the first start to the last end. */
  from?: string;
  to?: string;
  /** `range`: a marker at the current time. Default true. */
  now?: boolean;
  /** `range`: `horizontal` (time runs left to right, one row per lane, default) or `vertical` (time runs top to bottom, one column per lane). */
  direction?: 'horizontal' | 'vertical';
  /** Optional features (`timeEntry()`...). See `TimelinePlugin`. */
  plugins?: TimelinePlugin[];
}

/** Extends a Timeline without growing its base: `init` runs once it is rendered and may return a cleanup. The timeline fires `paint` after every repaint. */
export interface TimelinePlugin {
  init(timeline: Timeline): void | (() => void);
}

/** The time axis of a `range` timeline: its ends in ms, and how to read and write the item dates (`clock`: `'HH:mm'` of one day, else ISO). */
export interface TimelineScale {
  lo: number;
  hi: number;
  clock: boolean;
  vertical: boolean;
  parse(v: string): number;
  format(ms: number): string;
}

const CLOCK = /^\d{1,2}:\d{2}$/;
const pad = (n: number) => String(n).padStart(2, '0');

const DAY = 86400000;
const when = (v: string, o: Intl.DateTimeFormatOptions) => (/^\d{4}-\d{2}/.test(v) && !isNaN(+new Date(v)) ? new Intl.DateTimeFormat(getLocale()._lang, o).format(new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00` : v)) : v);

/** Events as a vertical list, or a schedule (phases, staff shifts) as bars on a time axis. Click or Enter on an item fires `select`. */
export class Timeline extends Component<TimelineConfig> {
  protected override baseCls = 'op-timeline';
  private items: TimelineItem[] = [];
  private scale?: TimelineScale;

  protected override build() {
    return h('div', this.baseCls);
  }

  protected override onRender() {
    this.el.classList.add(`op-timeline--${this.config.mode ?? 'list'}`);
    if (this.config.mode === 'range' && this.config.direction === 'vertical') this.el.classList.add('op-timeline--vertical');
    const store = this.config.store;
    if (store) this.own(store.subscribe(() => this.setItems(store.getFiltered().map((r) => r.data))));
    this.setItems(store ? store.getFiltered().map((r) => r.data) : (this.config.items ?? []));
    for (const p of this.config.plugins ?? []) {
      const off = p.init(this);
      if (off) this.own(off);
    }
    this.listen(this.el, 'click', (e: Event) => this.pick(e.target as HTMLElement));
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => e.key === 'Enter' && this.pick(e.target as HTMLElement));
  }

  private pick(el: HTMLElement) {
    const i = Number(el.closest<HTMLElement>('[data-i]')?.dataset.i);
    if (this.items[i]) this.emit('select', this.items[i]);
  }

  getItems(): TimelineItem[] {
    return this.items;
  }

  /** The time axis of a `range` timeline (set by the last paint), for plugins. */
  getScale(): TimelineScale | undefined {
    return this.scale;
  }

  setItems(items: TimelineItem[]) {
    this.items = items;
    if (this.rendered) this.paint();
  }

  private paint() {
    this.el.setAttribute('role', 'list');
    this.el.setAttribute('aria-label', this.config.ariaLabel ?? t('timeline'));
    this.el.replaceChildren(...(this.config.mode === 'range' ? this.range() : this.list()));
    this.emit('paint');
  }

  private list(): HTMLElement[] {
    return this.items.map((it, i) =>
      h('div', `op-timeline__item${it.tone && it.tone !== 'default' ? ` is-${it.tone}` : ''}`, { role: 'listitem', 'data-i': i, tabindex: 0 },
        h('div', 'op-timeline__when', {}, it.time ? when(it.time, /T/.test(it.time) ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : ''),
        h('div', 'op-timeline__marker', { 'aria-hidden': 'true' }, it.icon ? iconEl(it.icon) : null),
        h('div', 'op-timeline__body', {}, h('div', 'op-timeline__title', {}, it.title), it.text ? h('div', 'op-timeline__text', {}, it.text) : null),
      ),
    );
  }

  private range(): HTMLElement[] {
    const c = this.config;
    const clock = CLOCK.test(c.from ?? this.items.find((x) => x.start)?.start ?? '');
    const ms = (v: string) => (clock ? (Number(v.slice(0, -3)) * 60 + Number(v.slice(-2))) * 60000 : +new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00` : v));
    const spans = this.items.filter((x) => x.start).map((x) => ({ x, a: ms(x.start!), b: ms(x.end ?? x.start!) + (!clock && x.end && /^\d{4}-\d{2}-\d{2}$/.test(x.end) ? DAY : 0) }));
    if (!spans.length && !(c.from && c.to)) return [];
    const lo = c.from ? ms(c.from) : Math.min(...spans.map((s) => s.a));
    const hi = c.to ? ms(c.to) + (/^\d{4}-\d{2}-\d{2}$/.test(c.to) ? DAY : 0) : Math.max(...spans.map((s) => s.b), lo + 1);
    const vertical = c.direction === 'vertical';
    const pct = (v: number) => `${(Math.min(Math.max((v - lo) / (hi - lo), 0), 1) * 100).toFixed(3)}%`;
    const lanes = [...(c.lanes ?? []), ...spans.map((s) => s.x.lane ?? '').filter((l, i, a) => a.indexOf(l) === i && !(c.lanes ?? []).includes(l))];
    this.scale = { lo, hi, clock, vertical, parse: ms, format: (v) => (clock ? `${pad(Math.floor(v / 3600000))}:${pad(Math.round(v / 60000) % 60)}` : ((d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`)(new Date(v))) };
    const long = !clock && hi - lo > 62 * DAY;
    const tickEls: HTMLElement[] = [];
    const tickAt = (at: number, text: string) => {
      const tick = h('span', 'op-timeline__tick', {}, text);
      tick.style[vertical ? 'insetBlockStart' : 'insetInlineStart'] = pct(at);
      tickEls.push(tick);
    };
    if (clock) for (let at = Math.ceil(lo / 3600000) * 3600000, hop = (hi - lo) / 3600000 > 14 ? 7200000 : 3600000; at < hi; at += hop) tickAt(at, this.scale.format(at));
    else
      for (let d = new Date(lo); +d < hi; long ? d.setMonth(d.getMonth() + 1, 1) : d.setDate(d.getDate() + 1)) {
        d.setHours(0, 0, 0, 0);
        if (+d < lo) continue;
        tickAt(+d, new Intl.DateTimeFormat(getLocale()._lang, long ? { month: 'short' } : { day: 'numeric', month: 'short' }).format(d));
      }
    const out: HTMLElement[] = [h('div', 'op-timeline__axis', {}, h('span', 'op-timeline__lane-name'), h('div', 'op-timeline__track', { 'aria-hidden': 'true' }, ...tickEls))];
    for (const lane of lanes) {
      const bars = spans.filter((s) => (s.x.lane ?? '') === lane).map(({ x, a, b }) => {
        const bar = h('div', `op-timeline__bar${x.tone && x.tone !== 'default' ? ` is-${x.tone}` : ''}`, { role: 'listitem', tabindex: 0, 'data-i': this.items.indexOf(x), 'aria-label': `${x.title}, ${t('tlFromTo', { from: when(x.start!, { dateStyle: 'medium', timeStyle: /T/.test(x.start!) ? 'short' : undefined }), to: when(x.end ?? x.start!, { dateStyle: 'medium', timeStyle: /T/.test(x.end ?? '') ? 'short' : undefined }) })}` }, x.icon ? iconEl(x.icon) : null, h('span', 'op-timeline__bar-text', {}, x.title));
        bar.title = x.text ?? x.title;
        bar.style[vertical ? 'insetBlockStart' : 'insetInlineStart'] = pct(a);
        bar.style[vertical ? 'insetBlockEnd' : 'insetInlineEnd'] = `calc(100% - ${pct(Math.max(b, a + (hi - lo) / 200))})`;
        return bar;
      });
      out.push(h('div', 'op-timeline__lane', { role: 'group', 'aria-label': lane }, h('span', 'op-timeline__lane-name', {}, lane), h('div', 'op-timeline__track', {}, ...bars)));
    }
    this.el.style.gridTemplateColumns = vertical ? `var(--op-timeline-axis-width) repeat(${lanes.length}, minmax(0, 1fr))` : '';
    const now = Date.now();
    if (c.now !== false && !clock && now >= lo && now <= hi) {
      const mark = () => {
        const m = h('div', 'op-timeline__now', { 'aria-hidden': 'true', title: t('tlNow') });
        m.style[vertical ? 'insetBlockStart' : 'insetInlineStart'] = pct(now);
        return m;
      };
      if (vertical) for (const track of out.slice(1).map((l) => l.querySelector('.op-timeline__track')!)) track.append(mark());
      else out.push(h('div', 'op-timeline__nowrow', { 'aria-hidden': 'true' }, h('span', 'op-timeline__lane-name'), h('div', 'op-timeline__track', {}, mark())));
    }
    return out;
  }
}
register('timeline', Timeline);
