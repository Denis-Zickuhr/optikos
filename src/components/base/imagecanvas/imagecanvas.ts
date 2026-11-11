import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h, clamp } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { iconEl, registerIcons } from '../icon/icon';

registerIcons({ maximize: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>' });

addMessages('en', { imgZoomIn: 'Zoom in', imgZoomOut: 'Zoom out', imgReset: 'Reset zoom', imgError: 'The image could not be loaded' });
addMessages('pt-BR', { imgZoomIn: 'Aumentar', imgZoomOut: 'Diminuir', imgReset: 'Restaurar zoom', imgError: 'Não foi possível carregar a imagem' });

export interface ImageCanvasConfig extends ComponentConfig {
  src?: string;
  alt?: string;
  /** How the image fills the box at zoom 1. Default `contain`. */
  fit?: 'contain' | 'cover';
  /** Default `true`. */
  zoomable?: boolean;
  /** Default 8. */
  maxZoom?: number;
  /** The zoom buttons. Default `true`. */
  showTools?: boolean;
  /** CSS `aspect-ratio` of the box (e.g. `'16 / 9'`). */
  ratio?: string;
}

/** An image that fills its box, with zoom and pan. A plain `<img>` moved by a CSS transform. */
export class ImageCanvas extends Component<ImageCanvasConfig> {
  protected override baseCls = 'op-imagecanvas';
  private stage!: HTMLElement;
  private img!: HTMLImageElement;
  private status!: HTMLElement;
  private zoom = 1;
  private x = 0;
  private y = 0;
  private pointers = new Map<number, { x: number; y: number }>();

  protected override onRender() {
    const c = this.config;
    this.img = h('img', 'op-imagecanvas__img', { draggable: false });
    this.status = h('div', 'op-imagecanvas__status', { role: 'status' });
    this.stage = h('div', 'op-imagecanvas__stage', { tabindex: 0, role: 'img' }, this.img);
    this.el.append(this.stage, this.status);
    if (c.zoomable !== false && c.showTools !== false) {
      const btn = (icon: string, key: string, fn: () => void) => {
        const b = h('button', 'op-imagecanvas__tool', { type: 'button', 'aria-label': t(key), title: t(key) }, iconEl(icon));
        this.listen(b, 'click', fn);
        return b;
      };
      this.el.append(h('div', 'op-imagecanvas__tools', {},
        btn('minus', 'imgZoomOut', () => this.zoomBy(0.8)),
        btn('plus', 'imgZoomIn', () => this.zoomBy(1.25)),
        btn('maximize', 'imgReset', () => this.reset())));
    }
    if (c.ratio) this.el.style.aspectRatio = c.ratio;
    this.listen(this.img, 'load', () => {
      this.setLoading(false);
      this.el.classList.remove('is-error');
      this.status.textContent = '';
      this.emit('load');
    });
    this.listen(this.img, 'error', () => {
      this.setLoading(false);
      this.el.classList.add('is-error');
      this.status.textContent = t('imgError');
      this.emit('error');
    });
    if (c.zoomable !== false) this.bindZoom();
    this.setFit(c.fit ?? 'contain');
    this.setAlt(c.alt ?? '');
    this.setSrc(c.src ?? '');
  }

  private bindZoom() {
    const s = this.stage;
    this.listen(s, 'wheel', (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      this.zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
    }, { passive: false });
    this.listen(s, 'dblclick', (e: MouseEvent) => (this.zoom > 1 ? this.reset() : this.zoomBy(2, e.clientX, e.clientY)));
    this.listen(s, 'pointerdown', (e: PointerEvent) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      s.setPointerCapture?.(e.pointerId);
      this.el.classList.toggle('is-dragging', this.zoom > 1);
    });
    this.listen(s, 'pointermove', (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const others = [...this.pointers].filter(([id]) => id !== e.pointerId);
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (others.length) {
        const q = others[0][1];
        const before = Math.hypot(p.x - q.x, p.y - q.y);
        const after = Math.hypot(e.clientX - q.x, e.clientY - q.y);
        if (before) this.zoomBy(after / before, (e.clientX + q.x) / 2, (e.clientY + q.y) / 2);
      } else if (this.zoom > 1) this.pan(dx, dy);
      p.x = e.clientX;
      p.y = e.clientY;
    });
    const up = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      this.el.classList.remove('is-dragging');
    };
    this.listen(s, 'pointerup', up);
    this.listen(s, 'pointercancel', up);
    this.listen(s, 'keydown', (e: KeyboardEvent) => {
      const step = 40;
      const pan: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (e.key === '+' || e.key === '=') this.zoomBy(1.25);
      else if (e.key === '-') this.zoomBy(0.8);
      else if (e.key === '0') this.reset();
      else if (pan[e.key] && this.zoom > 1) this.pan(...pan[e.key]);
      else return;
      e.preventDefault();
    });
  }

  private pan(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.paint();
  }

  /** Keeps the image covering the box, then moves it. */
  private paint() {
    const w = this.stage.clientWidth;
    const hh = this.stage.clientHeight;
    this.x = clamp(this.x, -((this.zoom - 1) * w) / 2, ((this.zoom - 1) * w) / 2);
    this.y = clamp(this.y, -((this.zoom - 1) * hh) / 2, ((this.zoom - 1) * hh) / 2);
    this.img.style.transform = this.zoom === 1 ? '' : `translate(${this.x}px, ${this.y}px) scale(${this.zoom})`;
    this.el.classList.toggle('is-zoomed', this.zoom > 1);
  }

  /** Zooms to `level` (1 to `maxZoom`), keeping the point under the pointer (client coordinates) still; the centre by default. */
  zoomTo(level: number, clientX?: number, clientY?: number): void {
    const next = clamp(level, 1, this.config.maxZoom ?? 8);
    if (next === this.zoom || !this.rendered) return;
    const r = this.stage.getBoundingClientRect();
    const px = clientX == null ? 0 : clientX - (r.left + r.width / 2);
    const py = clientY == null ? 0 : clientY - (r.top + r.height / 2);
    const k = next / this.zoom;
    this.x = px - (px - this.x) * k;
    this.y = py - (py - this.y) * k;
    this.zoom = next;
    this.paint();
    this.emit('zoom', next);
  }
  zoomBy(factor: number, clientX?: number, clientY?: number): void {
    this.zoomTo(this.zoom * factor, clientX, clientY);
  }
  reset(): void {
    this.x = this.y = 0;
    this.zoomTo(1);
    this.paint();
  }
  getZoom(): number {
    return this.zoom;
  }

  setSrc(src: string): void {
    this.config.src = src;
    if (!this.rendered) return;
    this.zoom = 1;
    this.x = this.y = 0;
    this.paint();
    this.el.classList.remove('is-error');
    this.status.textContent = '';
    this.setLoading(!!src);
    if (src) this.img.src = src;
    else this.img.removeAttribute('src');
  }
  setAlt(alt: string): void {
    this.config.alt = alt;
    if (!this.rendered) return;
    this.img.alt = '';
    this.stage.setAttribute('aria-label', alt);
  }
  setFit(fit: 'contain' | 'cover'): void {
    this.config.fit = fit;
    if (this.rendered) this.img.style.objectFit = fit;
  }
}
register('imagecanvas', ImageCanvas);
