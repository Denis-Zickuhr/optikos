import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { layer } from '../../../core/layer';
import { iconEl } from '../../base/icon/icon';
import { pulse, enter } from '../../../motion/core';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top' | 'bottom';

export interface ToastConfig extends ComponentConfig {
  text?: string;
  title?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  /** ms before it closes by itself; 0 keeps it until closed. Default 4000. */
  duration?: number;
  closable?: boolean;
  position?: ToastPosition;
}

const defaults: { duration: number; position: ToastPosition; max: number } = { duration: 4000, position: 'top-right', max: 5 };
const icons = { info: 'info', success: 'success', warning: 'alert', error: 'error' };

function region(pos: ToastPosition): HTMLElement {
  let r = layer().querySelector<HTMLElement>(`.op-toast-region[data-pos="${pos}"]`);
  if (!r) {
    r = h('div', 'op-toast-region', { 'data-pos': pos });
    layer().appendChild(r);
  }
  return r;
}

export class Toast extends Component<ToastConfig> {
  protected override baseCls = 'op-toast';
  private cancelTimer?: () => void;
  private remaining = 0;
  private started = 0;

  protected override build() {
    const c = this.config;
    const type = c.type ?? 'info';
    const el = h('div', `op-toast op-toast--${type}`, { role: type === 'error' ? 'alert' : 'status' });
    const body = h('div', 'op-toast__body', {}, c.title ? h('div', 'op-toast__title', {}, c.title) : null, h('div', 'op-toast__text', {}, c.text ?? ''));
    el.append(h('span', 'op-toast__icon', {}, iconEl(icons[type])), body);
    if (c.closable !== false) {
      const x = h('button', 'op-toast__close', { type: 'button', 'aria-label': t('close') }, iconEl('x'));
      this.listen(x, 'click', () => this.close());
      el.append(x);
    }
    this.listen(el, 'pointerenter', () => this.pause());
    this.listen(el, 'pointerleave', () => this.resume());
    this.listen(el, 'focusin', () => this.pause());
    this.listen(el, 'focusout', () => this.resume());
    return el;
  }

  /** Puts the toast on screen and starts the timer. */
  override show() {
    const pos = this.config.position ?? defaults.position;
    const r = region(pos);
    if (pos.startsWith('bottom')) r.append(this.el);
    else r.prepend(this.el);
    for (const old of Array.from(r.children).filter((e) => e !== this.el).slice(defaults.max - 1)) (old as HTMLElement).dispatchEvent(new Event('op-dismiss'));
    this.listen(this.el, 'op-dismiss', () => this.close());
    this.remaining = this.config.duration ?? defaults.duration;
    this.resume();
    void enter(this.el, { dy: 10 });
    if (this.config.type === 'success') void pulse(this.el.querySelector<HTMLElement>('.op-toast__icon') ?? this.el); // a small ring confirms it worked
    this.emit('show');
  }

  private pause() {
    if (!this.cancelTimer) return;
    this.cancelTimer();
    this.cancelTimer = undefined;
    this.remaining -= Date.now() - this.started;
  }
  private resume() {
    if (this.cancelTimer || this.remaining <= 0 || this.destroyed) return;
    this.started = Date.now();
    this.cancelTimer = this.later(() => this.close(), this.remaining);
  }

  close() {
    if (this.destroyed) return;
    this.emit('close');
    this.destroy();
  }
}
register('toast', Toast);

export interface ToastHandle {
  close(): void;
}

/** `toast('Saved')` or `toast({ text, title, type, duration, closable, position })`. */
export function toast(opts: string | ToastConfig): ToastHandle {
  const t = new Toast(typeof opts === 'string' ? { text: opts } : opts);
  t.show();
  return { close: () => t.close() };
}
toast.configure = (o: Partial<typeof defaults>) => Object.assign(defaults, o);
