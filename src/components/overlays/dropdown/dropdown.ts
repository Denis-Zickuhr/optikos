import { Component, type ComponentConfig } from '../../../core/component';
import { register, create, type AnyConfig } from '../../../core/registry';
import { h } from '../../../core/dom';
import { toLayer } from '../../../core/layer';
import { place, track, type Placement } from '../../../core/position';
import { focusables } from '../../../core/focus';
import { popIn, popOut } from '../../../motion/core';

export interface DropdownConfig extends ComponentConfig {
  anchor?: HTMLElement | Component | { x: number; y: number };
  content?: HTMLElement | Component | AnyConfig;
  placement?: Placement;
  offset?: number;
  flip?: boolean;
  matchWidth?: boolean;
  closeOnOutside?: boolean;
  closeOnEsc?: boolean;
  role?: string;
  /** Move focus to the first focusable element of the content on open. */
  autoFocus?: boolean;
}

const openStack: Dropdown[] = [];

/** Floating panel anchored to an element. Lives in the global layer; closes on outside click and Esc. */
export class Dropdown extends Component<DropdownConfig> {
  protected override baseCls = 'op-dropdown';
  private content?: HTMLElement | Component;
  private open_ = false;
  private release: Array<() => void> = [];
  private leaving = 0;

  protected override build() {
    const el = h('div', 'op-dropdown', { role: this.config.role ?? 'dialog' });
    el.hidden = true;
    const c = this.config.content;
    if (c) {
      this.content = c instanceof HTMLElement || c instanceof Component ? c : create(c);
      el.append(this.content instanceof Component ? this.content.el : this.content);
    }
    return el;
  }

  getAnchor(): HTMLElement | undefined {
    const a = this.config.anchor;
    return a instanceof Component ? a.el : a instanceof HTMLElement ? a : undefined;
  }

  isOpen(): boolean {
    return this.open_;
  }

  open(): void {
    if (this.open_ || this.destroyed || this.emit('before-open') === false) return;
    const anchor = this.getAnchor();
    toLayer(this.el, anchor);
    this.leaving++; // a pending hide from a close animation must not hide us again
    this.el.getAnimations?.().forEach((a) => a.cancel());
    this.el.hidden = false;
    this.open_ = true;
    openStack.push(this);
    this.el.classList.add('is-open');
    if (this.content instanceof Component) this.content.notifyMount();
    this.reposition();
    void popIn(this.el, anchor ?? (this.config.anchor as { x: number; y: number } | undefined), 'dropdown');
    anchor?.setAttribute('aria-expanded', 'true');
    const c = this.config;
    const outside = (e: Event) => {
      const t = e.target as Node;
      if (c.closeOnOutside !== false && !this.el.contains(t) && !anchor?.contains(t)) this.close();
    };
    const key = (e: KeyboardEvent) => {
      // only the most recently opened dropdown reacts, so Esc closes one level at a time
      if (e.key === 'Escape' && c.closeOnEsc !== false && openStack[openStack.length - 1] === this) {
        e.stopPropagation();
        this.close();
        (anchor?.querySelector<HTMLElement>('input,button') ?? anchor)?.focus?.();
      }
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', key, true);
    this.release = [() => document.removeEventListener('pointerdown', outside, true), () => document.removeEventListener('keydown', key, true), track(() => this.reposition())];
    if (c.autoFocus) focusables(this.el)[0]?.focus();
    this.emit('open');
  }

  close(): void {
    if (!this.open_ || this.emit('before-close') === false) return;
    this.open_ = false;
    openStack.splice(openStack.indexOf(this), 1);
    this.el.classList.remove('is-open');
    // shrinks back toward the trigger, then hides (at once when there is no animation)
    const out = popOut(this.el, this.getAnchor() ?? (this.config.anchor as { x: number; y: number } | undefined), 'dropdown');
    if (out) {
      const id = ++this.leaving;
      void out.then(() => id === this.leaving && !this.open_ && (this.el.hidden = true));
    } else this.el.hidden = true;
    this.getAnchor()?.setAttribute('aria-expanded', 'false');
    this.release.splice(0).forEach((r) => r());
    this.emit('close');
  }

  toggle(): void {
    if (this.open_) this.close();
    else this.open();
  }

  reposition(): void {
    const anchor = this.getAnchor() ?? (this.config.anchor as { x: number; y: number } | undefined);
    if (!this.open_ || !anchor || anchor instanceof Component) return;
    const c = this.config;
    place(this.el, anchor, { placement: c.placement ?? 'bottom-start', offset: c.offset, flip: c.flip, matchWidth: c.matchWidth });
  }

  setAnchor(anchor: HTMLElement | Component | { x: number; y: number }): void {
    this.config.anchor = anchor;
    this.reposition();
  }
  setPlacement(placement: Placement): void {
    this.config.placement = placement;
    this.reposition();
  }
  setContent(content: HTMLElement | Component): void {
    if (this.content instanceof Component && this.content !== content) this.content.destroy();
    this.config.content = content;
    this.content = content;
    this.el.replaceChildren(content instanceof Component ? content.el : content);
    this.reposition();
  }

  protected override onDestroy() {
    if (this.open_) openStack.splice(openStack.indexOf(this), 1);
    this.open_ = false;
    this.release.splice(0).forEach((r) => r());
    this.getAnchor()?.setAttribute('aria-expanded', 'false');
    if (this.content instanceof Component) this.content.destroy();
  }
}
register('dropdown', Dropdown);
