import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import type { Model } from '../../../data/model';
import type { Timeline, TimelineItem, TimelinePlugin } from '../timeline/timeline';

addMessages('en', {
  teNew: 'New entry', teHours: '{h}h{m}', teHoursOnly: '{h}h', teMinutes: '{m}m', teTotal: 'Total', teAt: 'at {time}',
  teCreated: '{title} created, {range}, {lane}', teMoved: '{title} moved to {range}, {lane}', teResized: '{title} now {range}, {lane}', teRemoved: '{title} removed',
  teRefused: 'That overlaps another entry', teCursor: '{lane}: Enter adds an entry at {time}',
});
addMessages('pt-BR', {
  teNew: 'Novo apontamento', teHours: '{h}h{m}', teHoursOnly: '{h}h', teMinutes: '{m}min', teTotal: 'Total', teAt: 'às {time}',
  teCreated: '{title} criado, {range}, {lane}', teMoved: '{title} movido para {range}, {lane}', teResized: '{title} agora {range}, {lane}', teRemoved: '{title} removido',
  teRefused: 'Isso se sobrepõe a outro apontamento', teCursor: '{lane}: Enter cria um apontamento às {time}',
});

export interface TimeEntryOptions {
  /** Minutes everything snaps to. Default 15. */
  step?: number;
  /** Shortest entry, in minutes. Default `step`. */
  minDuration?: number;
  /** Length of an entry created with the keyboard, in minutes. Default 60. */
  duration?: number;
  /** `false` keeps two entries of one lane from overlapping: a drag stops at the neighbour, a move is refused. Default `true`. */
  overlap?: boolean;
  /** Let an entry change lane (drag up/down, ↑/↓). Default `false`. */
  moveAcrossLanes?: boolean;
  /** Minutes a lane should add up to: its total is `is-under`, `is-met` or `is-over` that. */
  target?: number;
  /** Return `false` to lock an entry (approved, invoiced): it cannot be moved, resized, edited or removed. */
  editable?: (item: TimelineItem) => boolean;
  /** Fields of a new entry besides `lane`, `start` and `end`. */
  defaults?: Partial<TimelineItem>;
}

type Span = { lane: string; start: number; end: number };
interface Drag {
  kind: 'create' | 'move' | 'start' | 'end';
  item?: TimelineItem;
  bar?: HTMLElement;
  from: Span;
  anchor: number;
  last: Span;
  ghost?: HTMLElement;
  holder: HTMLElement;
  id: number;
  invalid: boolean;
}

const MIN = 60000;
const LONG_PRESS = 450;

/** A duration in minutes as people write it: `7h30`, `8h`, `45m`. */
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  const [hh, mm] = [Math.floor(m / 60), m % 60];
  if (!hh) return t('teMinutes', { m: mm });
  return mm ? t('teHours', { h: hh, m: String(mm).padStart(2, '0') }) : t('teHoursOnly', { h: hh });
}

/**
 * Creates, moves, resizes and removes entries on a `range` Timeline: drag an empty lane to create, drag a block to move,
 * its ends to resize; the same with the keyboard (see the ficha). Snaps to `step`, keeps to `from`/`to`, can forbid
 * overlap and lock entries. Shows each lane's total (and a grand total) against `target`.
 *
 * Events on the timeline: `before-create({ lane, start, end })` → `create(item)`, `before-change(item, next, old)` →
 * `change(item, next, old)`, `before-remove(item)` → `remove(item)`, `edit(item)` (double click, Enter). With a `store`
 * the records are updated here (the app saves); without, the `items` are.
 * Touch: a block drags at once; an empty lane needs a long press (about half a second) so a swipe still scrolls.
 */
export function timeEntry(options: TimeEntryOptions = {}): TimelinePlugin {
  const step = options.step ?? 15;
  const min = options.minDuration ?? step;
  const stepMs = step * MIN;
  const minMs = min * MIN;
  const open = options.overlap !== false;

  return {
    init(tl: Timeline) {
      const el = tl.el;
      let drag: Drag | undefined;
      let press: ReturnType<typeof setTimeout> | undefined;
      let refocus: TimelineItem | undefined;
      const cursors = new Map<string, number>();
      const live = h('div', 'op-sr-only', { 'aria-live': 'polite' });
      let off: Array<() => void> = [];

      const sc = () => tl.getScale()!;
      const lock = (it: TimelineItem) => options.editable?.(it) === false;
      const lanes = () => Array.from(el.querySelectorAll<HTMLElement>('.op-timeline__lane'));
      const laneName = (lane: HTMLElement) => lane.getAttribute('aria-label') ?? '';
      const inLane = (name: string, skip?: TimelineItem) => tl.getItems().filter((x) => x !== skip && x.start && (x.lane ?? '') === name);
      const span = (it: TimelineItem): Span => ({ lane: it.lane ?? '', start: sc().parse(it.start!), end: sc().parse(it.end ?? it.start!) });
      const snap = (v: number) => sc().lo + Math.round((v - sc().lo) / stepMs) * stepMs;
      const pct = (v: number) => `${(((v - sc().lo) / (sc().hi - sc().lo)) * 100).toFixed(3)}%`;
      const place = (node: HTMLElement, s: Span) => {
        node.style.insetInlineStart = pct(s.start);
        node.style.insetInlineEnd = `calc(100% - ${pct(s.end)})`;
      };
      const range = (s: Span) => `${sc().format(s.start)}–${sc().format(s.end)}`.replace(/\d{4}-\d{2}-\d{2}T/g, '');
      const say = (key: string, it: Partial<TimelineItem>, s: Span) => (live.textContent = t(key, { title: it.title ?? t('teNew'), range: range(s), lane: s.lane }));
      const store = () => tl.config.store;
      const recOf = (it: TimelineItem): Model | undefined => store()?.getFiltered().find((r) => r.data === it);

      const msAt = (track: HTMLElement, x: number) => {
        const r = track.getBoundingClientRect();
        const f = r.width ? Math.min(1, Math.max(0, (x - r.left) / r.width)) : 0;
        return sc().lo + f * (sc().hi - sc().lo);
      };
      const laneAt = (y: number, fallback: HTMLElement) => lanes().find((l) => { const r = l.getBoundingClientRect(); return y >= r.top && y < r.bottom; }) ?? fallback;
      const trackOf = (lane: HTMLElement) => lane.querySelector<HTMLElement>('.op-timeline__track')!;

      const fits = (s: Span, skip?: TimelineItem) => open || !inLane(s.lane, skip).some((x) => { const o = span(x); return s.start < o.end && o.start < s.end; });
      const limit = (s: Span, around: Span, skip?: TimelineItem): Span => {
        if (open) return s;
        const others = inLane(s.lane, skip).map(span);
        const before = Math.max(sc().lo, ...others.filter((o) => o.end <= around.start).map((o) => o.end));
        const after = Math.min(sc().hi, ...others.filter((o) => o.start >= around.end).map((o) => o.start));
        return { ...s, start: Math.max(s.start, before), end: Math.min(s.end, after) };
      };

      function candidate(d: Drag, x: number, y: number): Span {
        const own = d.holder.closest<HTMLElement>('.op-timeline__lane')!;
        const track = trackOf(laneAt(y, own));
        const at = snap(msAt(trackOf(own), x));
        const { from } = d;
        if (d.kind === 'create') return limit({ lane: from.lane, start: Math.min(d.anchor, at), end: Math.max(d.anchor + minMs, at) }, { ...from, start: d.anchor, end: d.anchor });
        if (d.kind === 'start') return limit({ ...from, start: Math.max(sc().lo, Math.min(at, from.end - minMs)) }, from, d.item);
        if (d.kind === 'end') return limit({ ...from, end: Math.min(sc().hi, Math.max(at, from.start + minMs)) }, from, d.item);
        const len = from.end - from.start;
        const start = Math.min(sc().hi - len, Math.max(sc().lo, from.start + at - d.anchor));
        const lane = options.moveAcrossLanes ? laneName(track.closest<HTMLElement>('.op-timeline__lane')!) : from.lane;
        return { lane, start, end: start + len };
      }

      function show(d: Drag, s: Span) {
        const ok = fits(s, d.item) && s.end - s.start >= minMs;
        d.invalid = !ok;
        if (d.bar) d.bar.classList.toggle('is-invalid', !ok);
        d.ghost?.classList.toggle('is-invalid', !ok);
        if (!ok) return;
        d.last = s;
        const node = d.bar ?? d.ghost!;
        const lane = lanes().find((l) => laneName(l) === s.lane);
        if (lane && node.parentElement !== trackOf(lane)) trackOf(lane).append(node);
        place(node, s);
      }

      function finish(d: Drag, commit: boolean) {
        drag = undefined;
        d.holder.releasePointerCapture?.(d.id);
        d.holder.classList.remove('is-dragging', 'is-resizing');
        el.classList.remove('is-time-dragging');
        d.ghost?.remove();
        d.bar?.classList.remove('is-dragging', 'is-resizing', 'is-invalid');
        const s = d.last;
        const unchanged = d.kind !== 'create' && s.lane === d.from.lane && s.start === d.from.start && s.end === d.from.end;
        if (!commit || unchanged || (d.kind === 'create' && s.end - s.start < stepMs) || s.end - s.start < minMs) return void tl.setItems(tl.getItems());
        apply(d.kind, d.item, s, d.from);
      }

      function apply(kind: Drag['kind'] | 'key', item: TimelineItem | undefined, s: Span, from?: Span) {
        const values = { lane: s.lane, start: sc().format(s.start), end: sc().format(s.end) };
        if (!item) {
          if (tl.emit('before-create', values) === false) return void tl.setItems(tl.getItems());
          const made = { title: t('teNew'), ...options.defaults, ...values } as TimelineItem;
          const item = store() ? store()!.add(made)[0].data : made;
          refocus = item;
          tl.setItems(store() ? tl.getItems() : [...tl.getItems(), item]);
          say('teCreated', item, s);
          return void tl.emit('create', item);
        }
        const old = { lane: from!.lane, start: sc().format(from!.start), end: sc().format(from!.end) };
        if (tl.emit('before-change', item, values, old) === false) return void tl.setItems(tl.getItems());
        refocus = item;
        const rec = recOf(item);
        if (rec) for (const k of ['lane', 'start', 'end'] as const) rec.set(k, values[k]);
        else {
          Object.assign(item, values);
          tl.setItems([...tl.getItems()]);
        }
        say(kind === 'move' || kind === 'key' ? 'teMoved' : 'teResized', item, s);
        tl.emit('change', item, values, old);
      }

      function remove(item: TimelineItem) {
        if (lock(item) || tl.emit('before-remove', item) === false) return;
        const rec = recOf(item);
        if (rec) store()!.remove(rec);
        else tl.setItems(tl.getItems().filter((x) => x !== item));
        say('teRemoved', item, span(item));
        tl.emit('remove', item);
      }

      const itemOf = (bar: Element | null) => (bar ? tl.getItems()[Number((bar as HTMLElement).dataset.i)] : undefined);

      function begin(e: PointerEvent, d: Omit<Drag, 'id' | 'last' | 'invalid'>) {
        drag = { ...d, last: d.from, id: e.pointerId, invalid: false };
        d.holder.setPointerCapture?.(e.pointerId);
        el.classList.add('is-time-dragging');
        d.holder.classList.add(d.kind === 'move' || d.kind === 'create' ? 'is-dragging' : 'is-resizing');
        d.bar?.classList.add(d.kind === 'move' ? 'is-dragging' : 'is-resizing');
        if (d.kind === 'create') {
          drag.ghost = h('div', 'op-timeentry__ghost', { 'aria-hidden': 'true' });
          d.holder.append(drag.ghost);
          place(drag.ghost, { ...d.from, start: d.anchor, end: d.anchor + minMs });
        }
      }

      const onDown = (e: PointerEvent) => {
        if (e.button || drag) return;
        const target = e.target as HTMLElement;
        const bar = target.closest<HTMLElement>('.op-timeline__bar');
        const lane = target.closest<HTMLElement>('.op-timeline__lane');
        if (!lane) return;
        const track = trackOf(lane);
        if (bar) {
          const item = itemOf(bar);
          if (!item || lock(item)) return;
          const kind = target.closest('.op-timeentry__handle--start') ? 'start' : target.closest('.op-timeentry__handle--end') ? 'end' : 'move';
          e.preventDefault();
          return begin(e, { kind, item, bar, holder: track, from: span(item), anchor: snap(msAt(track, e.clientX)) });
        }
        if (!target.closest('.op-timeline__track')) return;
        const go = () => begin(e, { kind: 'create', holder: track, from: { lane: laneName(lane), start: 0, end: 0 }, anchor: snap(msAt(track, e.clientX)) });
        if (e.pointerType === 'touch') {
          press = setTimeout(() => ((press = undefined), go()), LONG_PRESS);
          return;
        }
        e.preventDefault();
        go();
      };
      const onMove = (e: PointerEvent) => {
        if (press && e.pointerType === 'touch') {
          clearTimeout(press);
          press = undefined;
        }
        if (!drag || e.pointerId !== drag.id) return;
        show(drag, candidate(drag, e.clientX, e.clientY));
      };
      const onUp = (e: PointerEvent) => {
        clearTimeout(press);
        press = undefined;
        if (drag && e.pointerId === drag.id) finish(drag, e.type === 'pointerup');
      };
      const onTouchMove = (e: TouchEvent) => drag && e.cancelable && e.preventDefault();
      const onDouble = (e: Event) => {
        const item = itemOf((e.target as HTMLElement).closest('.op-timeline__bar'));
        if (item && !lock(item)) tl.emit('edit', item);
      };

      const move = (item: TimelineItem, key: string, e: KeyboardEvent) => {
        const s = span(item);
        const dir = key === 'ArrowRight' ? 1 : -1;
        const len = s.end - s.start;
        let next: Span;
        if (e.altKey && e.shiftKey) next = { ...s, start: Math.min(s.end - minMs, Math.max(sc().lo, s.start + dir * stepMs)) };
        else if (e.shiftKey) next = { ...s, end: Math.max(s.start + minMs, Math.min(sc().hi, s.end + dir * stepMs)) };
        else {
          const start = Math.min(sc().hi - len, Math.max(sc().lo, s.start + dir * stepMs));
          next = { ...s, start, end: start + len };
        }
        const bounded = e.shiftKey ? limit(next, s, item) : next;
        if (bounded.end - bounded.start < minMs || !fits(bounded, item)) return void (live.textContent = t('teRefused'));
        if (bounded.start !== s.start || bounded.end !== s.end) apply('key', item, bounded, s);
      };
      const hop = (item: TimelineItem, dir: number) => {
        const names = lanes().map(laneName);
        const to = names[names.indexOf(item.lane ?? '') + dir];
        const s = span(item);
        if (to === undefined || !fits({ ...s, lane: to }, item)) return;
        apply('key', item, { ...s, lane: to }, s);
      };

      const onKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (e.key === 'Escape' && drag) {
          e.stopPropagation();
          return finish(drag, false);
        }
        const bar = target.closest<HTMLElement>('.op-timeline__bar');
        const item = itemOf(bar);
        if (item && bar === target) {
          if (lock(item)) return;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') move(item, e.key, e);
          else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && options.moveAcrossLanes) hop(item, e.key === 'ArrowUp' ? -1 : 1);
          else if (e.key === 'Enter') tl.emit('edit', item);
          else if (e.key === 'Delete' || e.key === 'Backspace') remove(item);
          else return;
        } else if (target.classList.contains('op-timeline__lane')) {
          const name = laneName(target);
          const at = cursors.get(name) ?? sc().lo;
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') cursors.set(name, Math.min(sc().hi - stepMs, Math.max(sc().lo, at + (e.key === 'ArrowRight' ? stepMs : -stepMs))));
          else if (e.key === 'Enter') {
            const end = Math.min(sc().hi, at + (options.duration ?? 60) * MIN);
            const s = limit({ lane: name, start: at, end }, { lane: name, start: at, end: at });
            if (s.end - s.start >= minMs && fits(s)) apply('create', undefined, s);
            else return void (live.textContent = t('teRefused'));
          } else return;
        } else return;
        e.preventDefault();
        e.stopPropagation();
        decorate();
      };

      function decorate() {
        if (!tl.getScale()) return;
        const items = tl.getItems();
        let all = 0;
        for (const lane of lanes()) {
          const name = laneName(lane);
          lane.tabIndex = 0;
          lane.classList.add('op-timeentry__lane');
          lane.setAttribute('aria-description', t('teCursor', { lane: name, time: sc().format(cursors.get(name) ?? sc().lo).replace(/^\d{4}-\d{2}-\d{2}T/, '') }));
          const total = inLane(name).reduce((n, x) => n + (span(x).end - span(x).start) / MIN, 0);
          all += total;
          const label = lane.querySelector('.op-timeline__lane-name')!;
          label.textContent = `${name || '—'} · ${formatDuration(total)}`;
          for (const k of ['under', 'met', 'over']) lane.classList.remove(`is-${k}`);
          if (options.target) lane.classList.add(total < options.target ? 'is-under' : total === options.target ? 'is-met' : 'is-over');
          const cur = cursors.get(name);
          lane.querySelector('.op-timeentry__cursor')?.remove();
          if (cur !== undefined) {
            const c = h('div', 'op-timeentry__cursor', { 'aria-hidden': 'true' });
            c.style.insetInlineStart = pct(cur);
            trackOf(lane).append(c);
          }
        }
        for (const bar of Array.from(el.querySelectorAll<HTMLElement>('.op-timeline__bar'))) {
          const item = items[Number(bar.dataset.i)];
          if (!item) continue;
          const s = span(item);
          const locked = lock(item);
          bar.classList.toggle('is-locked', locked);
          bar.setAttribute('aria-label', `${item.title}, ${range(s)}, ${s.lane}`);
          if (locked) bar.setAttribute('aria-disabled', 'true');
          else if (!bar.querySelector('.op-timeentry__handle')) bar.append(h('span', 'op-timeentry__handle op-timeentry__handle--start', { 'aria-hidden': 'true' }), h('span', 'op-timeentry__handle op-timeentry__handle--end', { 'aria-hidden': 'true' }));
          if (item === refocus) bar.focus();
        }
        refocus = undefined;
        el.querySelector('.op-timeentry__grand')?.remove();
        const grand = h('div', 'op-timeentry__grand', {}, h('span', '', {}, t('teTotal')), h('strong', '', {}, formatDuration(all)));
        el.append(grand, live);
      }

      const on = <E extends Event>(type: string, fn: (e: E) => void, opts?: AddEventListenerOptions | boolean) => {
        el.addEventListener(type, fn as EventListener, opts);
        off.push(() => el.removeEventListener(type, fn as EventListener, opts));
      };
      on('pointerdown', onDown);
      on('pointermove', onMove);
      on('pointerup', onUp);
      on('pointercancel', onUp);
      on('dblclick', onDouble);
      on('keydown', onKey, true);
      on('touchmove', onTouchMove, { passive: false });
      off.push(tl.on('paint', decorate));
      el.classList.add('op-timeline--entry');
      decorate();
      return () => {
        clearTimeout(press);
        off.forEach((f) => f());
        off = [];
        el.classList.remove('op-timeline--entry');
        live.remove();
        if (drag) finish(drag, false);
      };
    },
  };
}
