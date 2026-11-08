import { h } from './dom';

export interface VirtualOptions {
  /** Scrolling element. */
  scroller: HTMLElement;
  count: number;
  rowHeight: number;
  /** Extra rows rendered above/below the viewport. Default 6. */
  overscan?: number;
  /** Fills a pooled row element with the data of row `index`. */
  render(row: HTMLElement, index: number): void;
  rowCls?: string;
}

/** Fixed-height virtual list: only the visible rows exist in the DOM, reused as a pool. */
export function virtualize(o: VirtualOptions) {
  const overscan = o.overscan ?? 6;
  let { count, rowHeight } = o;
  const spacer = h('div', 'op-virtual');
  o.scroller.appendChild(spacer);
  const pool: HTMLElement[] = [];
  const assigned: number[] = [];

  function update(force = false) {
    spacer.style.height = `${count * rowHeight}px`;
    const viewH = o.scroller.clientHeight || 400;
    const need = Math.min(count, Math.ceil(viewH / rowHeight) + overscan * 2 + 1);
    if (need !== pool.length) {
      while (pool.length > need) pool.pop()!.remove();
      while (pool.length < need) {
        const row = h('div', o.rowCls ?? 'op-virtual__row');
        // rows are positioned by transform inside the spacer, whatever class the caller gives them
        row.style.cssText = 'position:absolute;inset-inline:0;top:0';
        pool.push(row);
        spacer.appendChild(row);
      }
      assigned.length = 0;
      force = true;
    }
    const first = Math.max(0, Math.min(Math.floor(o.scroller.scrollTop / rowHeight) - overscan, count - need));
    for (let i = first; i < first + need; i++) {
      const slot = i % need;
      if (!force && assigned[slot] === i) continue;
      assigned[slot] = i;
      const row = pool[slot];
      row.style.transform = `translateY(${i * rowHeight}px)`;
      row.style.height = `${rowHeight}px`;
      o.render(row, i);
    }
  }

  const onScroll = () => update();
  o.scroller.addEventListener('scroll', onScroll, { passive: true });
  update(true);

  return {
    spacer,
    /** Rows currently in the DOM. */
    rows: pool,
    refresh: () => update(true),
    setCount(n: number) {
      count = n;
      update(true);
    },
    setRowHeight(px: number) {
      rowHeight = px;
      update(true);
    },
    scrollTo(index: number) {
      const top = index * rowHeight;
      const viewH = o.scroller.clientHeight || 400;
      if (top < o.scroller.scrollTop) o.scroller.scrollTop = top;
      else if (top + rowHeight > o.scroller.scrollTop + viewH) o.scroller.scrollTop = top + rowHeight - viewH;
      update();
    },
    destroy() {
      o.scroller.removeEventListener('scroll', onScroll);
      spacer.remove();
    },
  };
}

/** Resolves a CSS length (usually a token expression like `var(--op-row-height)`) to pixels in the context of `el`. Returns 0 when not laid out. */
export function measure(el: HTMLElement, length: string): number {
  const probe = h('div');
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;block-size:${length}`;
  el.appendChild(probe);
  const n = probe.offsetHeight;
  probe.remove();
  return n;
}
