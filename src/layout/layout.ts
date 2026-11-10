import type { Component } from '../core/component';
import type { Container } from '../core/container';
import { px } from '../core/dom';

export interface Layout {
  init(c: Container): void;
  add?(c: Container, cmp: Component, index: number): void;
  remove?(c: Container, cmp: Component, index: number): void;
  /** Card only. */
  activate?(c: Container, cmp: Component): void;
  getActive?(c: Container): Component | undefined;
  /** Border only: below `narrowBelow` the west/east regions become drawers; these open and close them. */
  openRegion?(name: string): void;
  closeRegion?(name?: string): void;
  toggleRegion?(name: string): void;
  isRegionOpen?(name: string): boolean;
  /** Layouts that adapt to the width: whether the container is currently narrow, and a way to force it (tests, previews). */
  isNarrow?(): boolean;
  setNarrow?(narrow: boolean): void;
}

export type LayoutConfig = { type: string; [option: string]: unknown };
export type LayoutSpec = string | LayoutConfig | Layout;
export type LayoutFactory = (config: Record<string, any>) => Layout;

const factories = new Map<string, LayoutFactory>();

/** Registers a layout strategy under a name; users add their own the same way. */
export function registerLayout(name: string, factory: LayoutFactory): void {
  factories.set(name, factory);
}

export function createLayout(spec: LayoutSpec): Layout {
  if (typeof spec === 'object' && 'init' in spec) return spec as Layout;
  const cfg = (typeof spec === 'string' ? { type: spec } : spec) as LayoutConfig;
  const f = factories.get(cfg.type);
  if (!f) throw new Error(`Optikos: unknown layout "${cfg.type}"`);
  return f(cfg);
}

/**
 * Keeps the class `is-narrow` on the container body while it is narrower than `below` px (a ResizeObserver on the
 * container itself, not the window, so a layout inside a small panel adapts too). Emits `narrow-change` on the container.
 */
function watchNarrow(c: Container, below: number, on?: (narrow: boolean) => void) {
  const body = c.getBody();
  let narrow = false;
  const set = (n: boolean) => {
    if (n === narrow) return;
    narrow = n;
    body.classList.toggle('is-narrow', n);
    on?.(n);
    c.emit('narrow-change', n);
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => body.clientWidth > 0 && set(body.clientWidth < below));
    ro.observe(body);
    c.own(() => ro.disconnect());
  }
  return { isNarrow: () => narrow, setNarrow: set };
}

/** Layouts that are only a class plus custom properties; the CSS does the work. */
const cssLayout =
  (name: string, vars: string[] = []): LayoutFactory =>
  (cfg) => ({
    init(c) {
      const body = c.getBody();
      body.classList.add('op-layout', `op-layout-${name}`);
      for (const v of vars) if (cfg[v] != null) body.style.setProperty(`--op-layout-${v}`, px(cfg[v]));
    },
  });

registerLayout('fit', cssLayout('fit'));
const hbox = cssLayout('hbox', ['gap', 'align', 'justify', 'wrap']);
/** `stackBelow: 600`: under that width the row becomes a column. */
registerLayout('hbox', (cfg) => {
  const base = hbox(cfg);
  let w: ReturnType<typeof watchNarrow> | undefined;
  return {
    ...base,
    init(c) {
      base.init(c);
      if (cfg.stackBelow) {
        c.getBody().classList.add('op-layout-stack');
        w = watchNarrow(c, Number(cfg.stackBelow));
      }
    },
    isNarrow: () => !!w?.isNarrow(),
    setNarrow: (n) => w?.setNarrow(n),
  };
});
registerLayout('vbox', cssLayout('vbox', ['gap', 'align', 'justify', 'wrap']));

/** Numeric `columns` collapse to one column under `narrowBelow` px (default 480; `0` turns it off). */
registerLayout('grid', (cfg) => {
  let w: ReturnType<typeof watchNarrow> | undefined;
  return {
    init(c) {
      const body = c.getBody();
      body.classList.add('op-layout', 'op-layout-grid');
      if (cfg.gap != null) body.style.setProperty('--op-layout-gap', px(cfg.gap));
      const cols = cfg.columns ?? 1;
      if (typeof cols === 'number') {
        body.style.setProperty('--op-layout-columns', String(cols));
        const below = cfg.narrowBelow == null ? 480 : Number(cfg.narrowBelow);
        if (below > 0 && cols > 1) w = watchNarrow(c, below);
      } else body.style.gridTemplateColumns = cols;
    },
    add(_c, cmp) {
      const span = cmp.config.colspan;
      if (span) cmp.el.style.gridColumn = span === 'full' ? '1 / -1' : `span ${span}`;
    },
    isNarrow: () => !!w?.isNarrow(),
    setNarrow: (n) => w?.setNarrow(n),
  };
});

/**
 * Regions around a center. Under `narrowBelow` px (default 768) the west and east regions leave the grid and become
 * drawers over the center, closed until `openRegion('west')` (or `open: 'west'` in the layout config, to start open).
 * A scrim behind an open drawer closes it on click; Esc closes it too.
 */
registerLayout('border', (cfg) => {
  let w: ReturnType<typeof watchNarrow> | undefined;
  let cont!: Container;
  const regions = () => Array.from(cont.getBody().children).filter((e): e is HTMLElement => e instanceof HTMLElement && (e.dataset.region === 'west' || e.dataset.region === 'east'));
  const find = (name: string) => regions().find((e) => e.dataset.region === name);
  const sync = () => cont.getBody().classList.toggle('has-open-region', regions().some((e) => e.classList.contains('is-open')));
  const close = (name?: string) => {
    for (const e of regions()) if (!name || e.dataset.region === name) e.classList.remove('is-open');
    sync();
  };
  return {
    init(c) {
      cont = c;
      const body = c.getBody();
      body.classList.add('op-layout', 'op-layout-border');
      if (cfg.gap != null) body.style.setProperty('--op-layout-gap', px(cfg.gap));
      w = watchNarrow(c, cfg.narrowBelow == null ? 768 : Number(cfg.narrowBelow), (narrow) => {
        if (!narrow) close();
        else if (cfg.open) find(String(cfg.open))?.classList.add('is-open'), sync();
      });
      // the scrim is the body's own ::after: a click that lands on the body itself (not a child) closes the drawer
      c.listen(body, 'click', (e: Event) => e.target === body && close());
      c.listen(body, 'keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && body.classList.contains('has-open-region') && body.classList.contains('is-narrow')) {
          e.stopPropagation();
          close();
        }
      });
    },
    add(_c, cmp) {
      const region = cmp.config.region ?? 'center';
      cmp.el.style.gridArea = region;
      cmp.el.dataset.region = region;
    },
    openRegion(name) {
      const e = find(name);
      if (!e || !w?.isNarrow()) return;
      close();
      e.classList.add('is-open');
      sync();
      (e.querySelector<HTMLElement>('input,button,[tabindex]') ?? e).focus?.();
    },
    closeRegion: close,
    toggleRegion(name) {
      if (find(name)?.classList.contains('is-open')) close(name);
      else this.openRegion!(name);
    },
    isRegionOpen: (name) => !!find(name)?.classList.contains('is-open'),
    isNarrow: () => !!w?.isNarrow(),
    setNarrow: (n) => w?.setNarrow(n),
  };
});

registerLayout('card', (cfg) => {
  let active: Component | undefined;
  // children that were never rendered (lazy tabs) only get the flag; their DOM is not built just to hide it
  const show = (c: Container, cmp: Component | undefined) => {
    active = cmp;
    for (const i of c.items) {
      if (i.rendered) i.el.hidden = i !== cmp;
      else i.config.hidden = i !== cmp;
    }
    c.emit('activate', cmp);
  };
  return {
    init(c) {
      c.getBody().classList.add('op-layout', 'op-layout-fit');
      const a = cfg.activeItem ?? c.config.activeItem ?? 0;
      show(c, typeof a === 'number' ? c.items[a] : c.items.find((i) => i.id === a));
    },
    add(c, cmp) {
      cmp.el.hidden = cmp !== active && !!active;
      if (!active) show(c, cmp);
    },
    remove(c, cmp, index) {
      if (cmp === active) show(c, c.items[Math.min(index, c.items.length - 1)]);
    },
    activate: show,
    getActive: () => active,
  };
});
