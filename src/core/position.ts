export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Placement = Side | `${Side}-start` | `${Side}-end`;

export interface PlaceOptions {
  placement?: Placement;
  offset?: number;
  flip?: boolean;
  matchWidth?: boolean;
  margin?: number;
}

const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/** Positions a floating element (`position: fixed`) next to an anchor element or a point, flipping and clamping to the viewport. */
export function place(el: HTMLElement, anchor: Element | { x: number; y: number }, o: PlaceOptions = {}): void {
  const { offset = 4, flip = true, margin = 8 } = o;
  const [side0, align = 'center'] = (o.placement ?? 'bottom-start').split('-') as [Side, string?];
  const a = 'getBoundingClientRect' in anchor ? anchor.getBoundingClientRect() : { left: anchor.x, right: anchor.x, top: anchor.y, bottom: anchor.y, width: 0, height: 0 };
  if (o.matchWidth) el.style.minWidth = `${a.width}px`;
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  const w = el.offsetWidth;
  const hgt = el.offsetHeight;

  const fits = (s: Side) =>
    s === 'bottom' ? a.bottom + offset + hgt <= vh - margin : s === 'top' ? a.top - offset - hgt >= margin : s === 'right' ? a.right + offset + w <= vw - margin : a.left - offset - w >= margin;
  let side = side0;
  if (flip && !fits(side) && fits(opposite[side])) side = opposite[side];

  let left: number;
  let top: number;
  if (side === 'bottom' || side === 'top') {
    top = side === 'bottom' ? a.bottom + offset : a.top - offset - hgt;
    left = align === 'start' ? a.left : align === 'end' ? a.right - w : a.left + (a.width - w) / 2;
  } else {
    left = side === 'right' ? a.right + offset : a.left - offset - w;
    top = align === 'start' ? a.top : align === 'end' ? a.bottom - hgt : a.top + (a.height - hgt) / 2;
  }
  left = Math.max(margin, Math.min(left, vw - w - margin));
  top = Math.max(margin, Math.min(top, vh - hgt - margin));
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.dataset.side = side;
}

/** Calls `fn` (throttled to a frame) on any scroll or resize. Returns the cleanup function. */
export function track(fn: () => void): () => void {
  let queued = false;
  const run = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn();
    });
  };
  window.addEventListener('scroll', run, true);
  window.addEventListener('resize', run);
  return () => {
    window.removeEventListener('scroll', run, true);
    window.removeEventListener('resize', run);
  };
}
