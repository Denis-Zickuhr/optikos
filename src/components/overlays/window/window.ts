import { Panel, type PanelConfig } from '../../layout/panel/panel';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { toLayer, lockModal } from '../../../core/layer';
import { trapFocus, focusables } from '../../../core/focus';
import { popIn, popOut } from '../../../motion/core';
import { motion } from '../../../motion/config';

export interface WindowConfig extends PanelConfig {
  modal?: boolean;
  draggable?: boolean;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  /** Move focus inside on show. Default true. */
  autoFocus?: boolean;
}

/** Floating dialog. Modal by default: the page behind becomes inert and Tab stays inside. */
export class Window extends Panel<WindowConfig> {
  protected override baseCls = 'op-panel op-window';
  private backdrop?: HTMLElement;
  private visible = false;
  private cleanup: Array<() => void> = [];
  private opener: Element | null = null;
  private moved = false;
  private leaving = 0;

  constructor(config: WindowConfig = {}) {
    super({ closable: true, ...config });
  }

  protected override onRender() {
    super.onRender();
    const c = this.config;
    this.el.setAttribute('role', 'dialog');
    this.el.tabIndex = -1;
    if (c.modal !== false) this.el.setAttribute('aria-modal', 'true');
    if (c.draggable !== false) this.initDrag();
  }

  private initDrag() {
    this.headerEl.classList.add('op-window__handle');
    this.listen(this.headerEl, 'pointerdown', (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.op-panel__tool') || e.button) return;
      const r = this.el.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      this.el.classList.add('is-dragging');
      const move = (m: PointerEvent) => {
        this.el.style.left = `${Math.max(0, Math.min(m.clientX - dx, innerWidth - 40))}px`;
        this.el.style.top = `${Math.max(0, Math.min(m.clientY - dy, innerHeight - 40))}px`;
        this.moved = true;
      };
      const up = () => {
        this.el.classList.remove('is-dragging');
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      this.cleanup.push(up);
    });
  }

  isVisible(): boolean {
    return this.visible;
  }

  /** Centers in the viewport (also done on show and on resize until the user drags it). */
  center(): void {
    const el = this.el;
    el.style.left = `${Math.max(0, (innerWidth - el.offsetWidth) / 2)}px`;
    el.style.top = `${Math.max(0, (innerHeight - el.offsetHeight) / 3)}px`;
  }

  override show(): void {
    if (this.visible || this.destroyed || this.emit('before-show') === false) return;
    const c = this.config;
    const el = this.el;
    this.opener = document.activeElement;
    if (c.modal !== false) {
      this.backdrop = h('div', 'op-window-backdrop', {}, el);
      toLayer(this.backdrop, this.opener);
      this.cleanup.push(lockModal(this.backdrop));
      this.listen(this.backdrop, 'pointerdown', (e: Event) => {
        if (e.target !== this.backdrop) return;
        if (c.closeOnBackdrop) this.close();
        else el.focus();
      });
    } else toLayer(el, this.opener);
    this.visible = true;
    this.leaving++;
    el.getAnimations?.().forEach((a) => a.cancel());
    this.notifyMount();
    this.center();
    void popIn(el, this.opener ?? undefined, 'modal'); // grows out of the button that opened it
    this.backdrop?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: motion.ms('modal'), easing: motion.easing('enter') });
    this.cleanup.push(trapFocus(el));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && c.closeOnEsc !== false && !e.defaultPrevented) {
        e.stopPropagation();
        this.close();
      }
    };
    el.addEventListener('keydown', onKey);
    const onResize = () => !this.moved && this.center();
    window.addEventListener('resize', onResize);
    this.cleanup.push(() => el.removeEventListener('keydown', onKey), () => window.removeEventListener('resize', onResize));
    if (c.autoFocus !== false) this.focusFirst();
    this.emit('show');
  }

  private focusFirst() {
    const inBody = focusables(this.bodyEl)[0];
    const primary = this.el.querySelector<HTMLElement>('.op-panel__footer .op-button--primary');
    (inBody ?? primary ?? focusables(this.el).find((e) => !e.classList.contains('op-panel__tool')) ?? this.el).focus();
  }

  override hide(): void {
    if (!this.visible || this.emit('before-hide') === false) return;
    this.release();
    this.emit('hide');
  }

  /** Cleans up at once (the page is usable again) and takes the window off the screen: shrinking toward its opener, 20 % faster than it came. */
  private release(animate = true) {
    this.visible = false;
    this.cleanup.splice(0).reverse().forEach((f) => f());
    const bd = this.backdrop;
    this.backdrop = undefined;
    const target = bd ?? this.el;
    const out = animate ? popOut(this.el, this.opener ?? undefined, 'modal') : null;
    if (out) {
      const id = ++this.leaving;
      bd?.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: motion.ms('modal', 'exit'), easing: motion.easing('exit'), fill: 'forwards' });
      void out.then(() => id === this.leaving && !this.visible && (target.remove(), bd?.remove()));
    } else {
      target.remove();
      bd?.remove();
    }
    if (this.opener instanceof HTMLElement && this.opener.isConnected) this.opener.focus();
  }

  protected override onDestroy() {
    if (this.visible) this.release(false);
    else if (this.leaving) (this.el.closest('.op-window-backdrop') ?? this.el).remove();
    super.onDestroy();
  }
}
register('window', Window);
