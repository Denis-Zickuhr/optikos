import { Panel, type PanelConfig, type PanelTool } from '../../layout/panel/panel';
import { register } from '../../../core/registry';
import { t, addMessages } from '../../../core/i18n';
import { toLayer } from '../../../core/layer';
import { focusables } from '../../../core/focus';

addMessages('en', {
  wDockLeft: 'Dock to the left',
  wDockRight: 'Dock to the right',
  wDockTop: 'Dock to the top',
  wDockBottom: 'Dock to the bottom',
});
addMessages('pt-BR', {
  wDockLeft: 'Fixar à esquerda',
  wDockRight: 'Fixar à direita',
  wDockTop: 'Fixar em cima',
  wDockBottom: 'Fixar embaixo',
});

export type WidgetSide = 'right' | 'left' | 'top' | 'bottom';

export interface WidgetConfig extends PanelConfig {
  side?: WidgetSide;
  /** Float above the page (default). `false`: an ordinary panel where the layout puts it. */
  floating?: boolean;
  /** Width on the sides, height on top/bottom (CSS length or px). */
  size?: number | string;
  /** Header buttons that let the user pick the side. */
  sideSwitcher?: boolean;
  /** Which sides the switcher offers. Default left, right, bottom. */
  sides?: WidgetSide[];
  closeOnEsc?: boolean;
  autoFocus?: boolean;
  /** The user can move it by its header (pointer drag, or Alt+arrow keys). A move frees it from the side; `setSide` docks it again. */
  draggable?: boolean;
}

const ICON: Record<WidgetSide, string> = { left: 'chevron-left', right: 'chevron-right', top: 'chevron-up', bottom: 'chevron-down' };
const LABEL: Record<WidgetSide, string> = { left: 'wDockLeft', right: 'wDockRight', top: 'wDockTop', bottom: 'wDockBottom' };
const SIDES: WidgetSide[] = ['right', 'left', 'top', 'bottom'];

/** A panel that floats over the page, attached to one edge. Not modal: the page behind stays usable. */
export class Widget extends Panel<WidgetConfig> {
  protected override baseCls = 'op-panel op-widget';
  private opened = false;
  private opener: Element | null = null;
  private cancelHide?: () => void;
  private userTools: number;
  private pos?: { x: number; y: number };

  constructor(config: WidgetConfig = {}) {
    const tools: PanelTool[] = [...(config.tools ?? [])];
    const sides = config.sides ?? (['left', 'right', 'bottom'] as WidgetSide[]);
    // `this` does not exist yet: the handlers look the widget up through the panel they receive
    if (config.sideSwitcher) for (const s of sides) tools.push({ icon: ICON[s], label: t(LABEL[s]), handler: (p) => (p as Widget).setSide(s) });
    super({ closable: true, closeAction: 'hide', floating: true, side: 'right', layout: 'fit', hidden: true, ...config, tools });
    this.userTools = config.tools?.length ?? 0;
  }

  protected override onRender() {
    super.onRender();
    const c = this.config;
    this.el.setAttribute('role', 'complementary');
    this.el.classList.toggle('is-floating', c.floating !== false);
    if (c.sideSwitcher) {
      (c.sides ?? ['left', 'right', 'bottom']).forEach((s, i) => {
        const b = this.el.querySelectorAll<HTMLElement>('.op-panel__tool')[this.userTools + i];
        if (b) b.dataset.side = s;
      });
    }
    this.paintSide();
    if (c.size != null) this.setSize(c.size);
    if (c.draggable && c.floating !== false) this.initDrag();
    this.listen(this.el, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && c.closeOnEsc !== false && !e.defaultPrevented && c.floating !== false) {
        e.stopPropagation();
        this.close();
      }
    });
  }

  // ---- side / size ---------------------------------------------------------------------------

  getSide(): WidgetSide {
    return this.config.side ?? 'right';
  }

  setSide(side: WidgetSide): void {
    if (side === this.getSide() || !SIDES.includes(side)) return;
    this.config.side = side;
    this.resetPosition();
    this.paintSide();
    this.emit('side-change', side);
  }

  private paintSide(): void {
    if (!this.rendered) return;
    const side = this.getSide();
    for (const s of SIDES) this.el.classList.toggle(`op-widget--${s}`, s === side);
    for (const b of Array.from(this.el.querySelectorAll<HTMLElement>('[data-side]'))) b.setAttribute('aria-pressed', String(b.dataset.side === side));
  }

  /** Where the user left it (viewport px), or undefined while it sits on its side. */
  getPosition(): { x: number; y: number } | undefined {
    return this.pos;
  }

  /** Puts a dragged widget back on its side. */
  resetPosition(): void {
    if (!this.pos) return;
    this.pos = undefined;
    const st = this.el.style;
    for (const k of ['inset', 'inset-inline', 'inset-block', 'left', 'top', 'width', 'height']) st.removeProperty(k);
    this.el.classList.remove('is-moved');
    this.emit('move', undefined);
  }

  private moveTo(x: number, y: number): void {
    const el = this.el;
    if (!this.pos) {
      // first move: pin the current size, because the side rules (insets) stop applying
      const r = el.getBoundingClientRect();
      if (r.width) {
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
      }
      el.classList.add('is-moved');
    }
    const w = el.offsetWidth || el.getBoundingClientRect().width;
    const h = el.offsetHeight || el.getBoundingClientRect().height;
    this.pos = { x: Math.max(0, Math.min(x, innerWidth - Math.min(w, innerWidth) )), y: Math.max(0, Math.min(y, innerHeight - Math.min(h, innerHeight))) };
    el.style.inset = 'auto';
    el.style.left = `${this.pos.x}px`;
    el.style.top = `${this.pos.y}px`;
    this.emit('move', this.pos);
  }

  private initDrag(): void {
    const head = this.headerEl;
    head.classList.add('op-widget__handle');
    head.tabIndex = 0;
    head.setAttribute('aria-roledescription', 'draggable');
    this.listen(head, 'pointerdown', (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.op-panel__tool') || e.button) return;
      const r = this.el.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      this.el.classList.add('is-dragging');
      const move = (m: PointerEvent) => this.moveTo(m.clientX - dx, m.clientY - dy);
      const up = () => {
        this.el.classList.remove('is-dragging');
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      this.own(up);
    });
    // keyboard: Alt+arrows nudge it, Alt+Home puts it back on its side
    this.listen(head, 'keydown', (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const step = e.shiftKey ? 64 : 16;
      const r = this.el.getBoundingClientRect();
      const to: Record<string, [number, number]> = { ArrowLeft: [r.left - step, r.top], ArrowRight: [r.left + step, r.top], ArrowUp: [r.left, r.top - step], ArrowDown: [r.left, r.top + step] };
      if (e.key === 'Home') {
        e.preventDefault();
        this.resetPosition();
      } else if (to[e.key]) {
        e.preventDefault();
        this.moveTo(...to[e.key]);
      }
    });
  }

  setSize(size: number | string): void {
    this.config.size = size;
    if (this.rendered) this.el.style.setProperty('--op-widget-size', typeof size === 'number' ? `${size}px` : size);
  }

  // ---- open / close --------------------------------------------------------------------------

  isOpen(): boolean {
    return this.config.floating === false ? !this.isHidden() : this.opened;
  }
  open(): void {
    this.show();
  }
  /** Opens or closes (with no argument: the other one). `toggle()` stays the Panel's collapse. */
  setOpen(open = !this.isOpen()): void {
    if (open) this.show();
    else this.hide();
  }

  override show(): void {
    if (this.config.floating === false) return super.show();
    if (this.opened || this.destroyed || this.emit('before-show') === false) return;
    this.cancelHide?.();
    this.opener = document.activeElement;
    const el = this.el;
    this.opened = true;
    this.config.hidden = false;
    toLayer(el, this.opener);
    el.hidden = false;
    this.notifyMount();
    // next frame, so the slide-in transition has a starting point
    requestAnimationFrame(() => this.opened && el.classList.add('is-open'));
    if (this.config.autoFocus !== false) (focusables(this.getBody())[0] ?? el).focus();
    this.emit('show');
  }

  override hide(): void {
    if (this.config.floating === false) return super.hide();
    if (!this.opened || this.emit('before-hide') === false) return;
    this.opened = false;
    this.config.hidden = true;
    this.el.classList.remove('is-open');
    this.cancelHide = this.later(() => (this.el.hidden = true), 250);
    const back = this.opener;
    if (back instanceof HTMLElement && back.isConnected && this.el.contains(document.activeElement)) back.focus();
    this.emit('hide');
  }

  protected override onDestroy(): void {
    super.onDestroy();
    this.el.remove();
  }
}
register('widget', Widget);
