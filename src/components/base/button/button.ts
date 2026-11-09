import { Component, type ComponentConfig } from '../../../core/component';
import { register } from '../../../core/registry';
import { h } from '../../../core/dom';
import { iconEl } from '../icon/icon';
import { pulse } from '../../../motion/core';

export interface ButtonConfig extends ComponentConfig {
  text?: string;
  icon?: string;
  iconPos?: 'left' | 'right';
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  htmlType?: 'button' | 'submit' | 'reset';
  handler?: (button: Button, ev: MouseEvent) => unknown;
  /** Behaves as a toggle button (`aria-pressed`). */
  toggle?: boolean;
  pressed?: boolean;
  /** Text shown while loading. Default: `text`. Passing a string to `loading` sets it too. */
  loadingText?: string;
}

export class Button extends Component<ButtonConfig> {
  protected override baseCls = 'op-button';
  protected override tag = 'button' as const;
  private textEl!: HTMLElement;
  private busyTextEl!: HTMLElement;
  private iconHost!: HTMLElement;

  protected override build() {
    const c = this.config;
    const el = h('button', 'op-button', { type: c.htmlType ?? 'button' });
    this.iconHost = h('span', 'op-button__icon');
    this.textEl = h('span', 'op-button__text');
    // Two layers share one grid cell: the normal face and the loading face. The inactive one is hidden by CSS,
    // so the button is as wide as the wider of the two and never jumps when loading starts.
    this.busyTextEl = h('span', 'op-button__busy-text');
    el.append(
      h('span', 'op-button__face', {}, this.iconHost, this.textEl),
      h('span', 'op-button__busy', {}, h('span', 'op-spinner op-button__spinner', { 'aria-hidden': 'true' }), this.busyTextEl),
    );
    return el;
  }

  protected override onRender() {
    const c = this.config;
    this.setText(c.text ?? '');
    this.setIcon(c.icon ?? '');
    this.setVariant(c.variant ?? 'default');
    this.setPressed(!!c.pressed);
    if (!c.text && !c.ariaLabel && !c.tooltip) console.warn('Optikos: icon-only Button needs ariaLabel');
    this.listen(this.el, 'click', (e: MouseEvent) => {
      if (c.disabled || c.loading) return e.preventDefault();
      if (c.toggle) {
        this.setPressed(!c.pressed);
        this.emit('toggle', c.pressed);
      }
      if (this.emit('click', e) === false) return e.preventDefault();
      c.handler?.(this, e);
    });
  }

  protected override onDisabled(disabled: boolean) {
    (this.el as HTMLButtonElement).disabled = disabled;
  }

  setText(text: string) {
    this.config.text = text;
    if (!this.rendered) return;
    this.textEl.textContent = text;
    this.textEl.hidden = !text;
    this.busyTextEl.textContent = this.config.loadingText ?? text;
  }

  setIcon(name: string) {
    this.config.icon = name;
    if (!this.rendered) return;
    this.iconHost.replaceChildren(...(name ? [iconEl(name)] : []));
    this.iconHost.hidden = !name;
    this.el.classList.toggle('op-button--icon-right', this.config.iconPos === 'right');
  }

  setVariant(variant: NonNullable<ButtonConfig['variant']>) {
    this.config.variant = variant;
    if (!this.rendered) return;
    for (const v of ['default', 'primary', 'danger', 'ghost']) this.el.classList.toggle(`op-button--${v}`, v === variant);
  }

  setPressed(pressed: boolean) {
    this.config.pressed = pressed;
    if (!this.rendered) return;
    this.el.classList.toggle('is-pressed', pressed);
    if (this.config.toggle) this.el.setAttribute('aria-pressed', String(pressed));
  }

  /** The button shows its own spinner (no mask) and ignores clicks while loading. A string is the loading text. */
  override setLoading(loading: boolean | string) {
    this.config.loading = loading;
    if (typeof loading === 'string') this.setLoadingText(loading);
    if (!this.rendered) return;
    this.el.classList.toggle('is-loading', !!loading);
    // the visible (loading) face names the button; it ignores clicks meanwhile, so it is announced as unavailable
    for (const a of ['aria-busy', 'aria-disabled']) (loading ? this.el.setAttribute(a, 'true') : this.el.removeAttribute(a));
  }

  setLoadingText(text: string) {
    this.config.loadingText = text;
    if (this.rendered) this.busyTextEl.textContent = text;
  }

  /** A subtle ring that confirms the action worked (motion rule 8). */
  pulse(): void {
    void pulse(this.el);
  }

  click() {
    (this.el as HTMLButtonElement).click();
  }
}
register('button', Button);
