import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, getLocale } from '../../../core/i18n';
import { toISO, fromISO, today, addDays, addMonths, firstDay } from '../../../core/date';
import { iconEl } from '../../base/icon/icon';

/** Both ends are `YYYY-MM-DD`; `end` is null while the user has only picked the first day. */
export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface CalendarConfig extends ComponentConfig {
  /** Selected day, `YYYY-MM-DD`; with `range: true`, a `DateRange`. */
  value?: string | DateRange | null;
  /** Pick a start and an end day (two clicks). */
  range?: boolean;
  min?: string;
  max?: string;
  /** 0 = Sunday. Default: the locale's. */
  firstDay?: number;
  isDisabled?: (iso: string) => boolean;
}

const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat(getLocale()._lang, opts).format(d);

/** Month calendar. Click the title to pick a month; arrow keys, Page keys and Home/End move the focused day. */
export class Calendar extends Component<CalendarConfig> {
  protected override baseCls = 'op-calendar';
  private cursor = today(); // the focused day; its month is the visible month
  private mode: 'days' | 'months' = 'days';
  private titleEl!: HTMLElement;
  private bodyEl!: HTMLElement;
  private prevEl!: HTMLButtonElement;
  private nextEl!: HTMLButtonElement;

  protected override build() {
    const el = h('div', 'op-calendar', { role: 'dialog', 'aria-label': t('calMonth') });
    this.prevEl = h('button', 'op-calendar__nav', { type: 'button', 'aria-label': t('calPrev') }, iconEl('chevron-left'));
    this.nextEl = h('button', 'op-calendar__nav', { type: 'button', 'aria-label': t('calNext') }, iconEl('chevron-right'));
    this.titleEl = h('button', 'op-calendar__title', { type: 'button', 'aria-live': 'polite' });
    this.bodyEl = h('div', 'op-calendar__body');
    el.append(h('div', 'op-calendar__header', {}, this.prevEl, this.titleEl, this.nextEl), this.bodyEl);
    return el;
  }

  protected override onRender() {
    const v = this.first();
    if (v && fromISO(v)) this.cursor = v;
    this.listen(this.prevEl, 'click', () => this.step(-1));
    this.listen(this.nextEl, 'click', () => this.step(1));
    this.listen(this.titleEl, 'click', () => {
      this.mode = this.mode === 'days' ? 'months' : 'days';
      this.paint();
    });
    this.listen(this.bodyEl, 'click', (e: Event) => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-iso],[data-month]');
      if (!cell) return;
      if (cell.dataset.month) {
        const [y, m] = cell.dataset.month.split('-').map(Number);
        const cur = fromISO(this.cursor)!;
        this.cursor = addMonths(this.cursor, (y - cur.getFullYear()) * 12 + (m - 1 - cur.getMonth()));
        this.mode = 'days';
        this.paint();
        this.emit('navigate', y, m - 1);
        this.focusDay();
      } else this.choose(cell.dataset.iso!);
    });
    this.listen(this.bodyEl, 'keydown', (e: KeyboardEvent) => this.onKey(e));
    this.paint();
  }

  private blocked(iso: string) {
    const { min, max, isDisabled } = this.config;
    return (!!min && iso < min) || (!!max && iso > max) || !!isDisabled?.(iso);
  }

  /** The value as a range (a single day is a one-day range). */
  private span(): DateRange {
    const v = this.config.value;
    return !v ? { start: null, end: null } : typeof v === 'string' ? { start: v, end: v } : v;
  }
  private first(): string | null {
    return this.span().start;
  }

  private choose(iso: string) {
    if (this.blocked(iso)) return;
    if (!this.config.range) {
      this.setValue(iso);
      return void this.emit('select', iso);
    }
    const { start, end } = this.span();
    if (start && !end) {
      const r = iso < start ? { start: iso, end: start } : { start, end: iso };
      this.setValue(r);
      this.emit('select', r);
    } else {
      this.setValue({ start: iso, end: null });
      this.emit('start', iso);
    }
  }

  private step(dir: number) {
    this.cursor = this.mode === 'days' ? addMonths(this.cursor, dir) : addMonths(this.cursor, dir * 12);
    this.paint();
    const d = fromISO(this.cursor)!;
    this.emit('navigate', d.getFullYear(), d.getMonth());
  }

  private move(next: string) {
    const before = fromISO(this.cursor)!;
    this.cursor = next;
    const d = fromISO(next)!;
    this.paint();
    if (d.getMonth() !== before.getMonth() || d.getFullYear() !== before.getFullYear()) this.emit('navigate', d.getFullYear(), d.getMonth());
    this.focusDay();
  }

  private onKey(e: KeyboardEvent) {
    if (this.mode !== 'days') return;
    const c = this.cursor;
    const dow = (fromISO(c)!.getDay() - this.weekStart() + 7) % 7;
    const moves: Record<string, string> = {
      ArrowLeft: addDays(c, -1),
      ArrowRight: addDays(c, 1),
      ArrowUp: addDays(c, -7),
      ArrowDown: addDays(c, 7),
      Home: addDays(c, -dow),
      End: addDays(c, 6 - dow),
      PageUp: addMonths(c, e.shiftKey ? -12 : -1),
      PageDown: addMonths(c, e.shiftKey ? 12 : 1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      this.move(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.choose(c);
    }
  }

  private weekStart() {
    return this.config.firstDay ?? firstDay();
  }

  private paint() {
    const cur = fromISO(this.cursor)!;
    this.el.classList.toggle('is-months', this.mode === 'months');
    this.titleEl.textContent = this.mode === 'days' ? fmt({ month: 'long', year: 'numeric' }, cur) : String(cur.getFullYear());
    this.mode === 'days' ? this.paintDays(cur) : this.paintMonths(cur);
  }

  private paintDays(cur: Date) {
    const first = this.weekStart();
    const head = h('tr');
    for (let i = 0; i < 7; i++) {
      const d = new Date(2023, 0, 1 + ((first + i) % 7)); // 2023-01-01 is a Sunday
      head.append(h('th', 'op-calendar__dow', { scope: 'col', abbr: fmt({ weekday: 'long' }, d) }, fmt({ weekday: 'short' }, d)));
    }
    const rows: HTMLElement[] = [];
    const start = new Date(cur.getFullYear(), cur.getMonth(), 1);
    start.setDate(1 - ((start.getDay() - first + 7) % 7));
    const todayIso = today();
    const { start: from, end: to } = this.config.range ? this.span() : { start: this.first(), end: this.first() };
    for (let w = 0; w < 6; w++) {
      const tr = h('tr');
      for (let d = 0; d < 7; d++) {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
        const iso = toISO(day);
        const td = h('td', 'op-calendar__day', {
          role: 'gridcell',
          'data-iso': iso,
          tabindex: iso === this.cursor ? 0 : -1,
          'aria-selected': String(!!from && iso >= from && iso <= (to ?? from)),
          'aria-label': fmt({ dateStyle: 'full' }, day),
          'aria-disabled': this.blocked(iso) ? 'true' : null,
          'aria-current': iso === todayIso ? 'date' : null,
        }, String(day.getDate()));
        td.classList.toggle('is-outside', day.getMonth() !== cur.getMonth());
        td.classList.toggle('is-today', iso === todayIso);
        td.classList.toggle('is-selected', iso === from || iso === to);
        td.classList.toggle('is-in-range', !!from && !!to && iso > from && iso < to);
        td.classList.toggle('is-range-start', !!this.config.range && iso === from);
        td.classList.toggle('is-range-end', !!this.config.range && iso === to);
        td.classList.toggle('is-disabled', this.blocked(iso));
        tr.append(td);
      }
      rows.push(tr);
    }
    this.bodyEl.replaceChildren(h('table', 'op-calendar__grid', { role: 'grid' }, h('thead', '', {}, head), h('tbody', '', {}, ...rows)));
  }

  private paintMonths(cur: Date) {
    const cells = Array.from({ length: 12 }, (_, m) => {
      const b = h('button', 'op-calendar__month', { type: 'button', 'data-month': `${cur.getFullYear()}-${String(m + 1).padStart(2, '0')}` }, fmt({ month: 'short' }, new Date(2000, m, 1)));
      b.classList.toggle('is-selected', m === cur.getMonth());
      return b;
    });
    this.bodyEl.replaceChildren(h('div', 'op-calendar__months', {}, ...cells));
  }

  // ---- API -----------------------------------------------------------------------------------

  setValue(value: string | DateRange | null) {
    this.config.value = value;
    const iso = this.first();
    if (iso && fromISO(iso)) this.cursor = iso;
    if (this.rendered) {
      this.mode = 'days';
      this.paint();
    }
  }
  /** Switches between single-day and range picking. */
  setRange(range: boolean) {
    this.config.range = range;
    this.config.value = null;
    if (this.rendered) this.paint();
  }
  setMin(min: string | undefined) {
    this.config.min = min;
    if (this.rendered) this.paint();
  }
  setMax(max: string | undefined) {
    this.config.max = max;
    if (this.rendered) this.paint();
  }
  showMonth(year: number, month: number) {
    this.cursor = toISO(new Date(year, month, 1));
    if (this.rendered) this.paint();
  }
  focusDay() {
    this.render();
    this.bodyEl.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }
}
register('calendar', Calendar);
