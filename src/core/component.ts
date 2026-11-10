import { Emitter, type Handler } from './emitter';
import { h, uid, kebab, px } from './dom';
import { t } from './i18n';

export interface ComponentConfig {
  type?: string;
  id?: string;
  cls?: string;
  style?: string | Record<string, string | number>;
  hidden?: boolean;
  disabled?: boolean;
  width?: number | string;
  height?: number | string;
  flex?: number | string;
  tooltip?: string;
  /** Inside a Form: shown only while this returns true (given the form values). A field hidden this way neither validates nor goes into `getValues`. */
  showIf?: (values: Record<string, any>) => boolean;
  /** Inside a Form: enabled only while this returns true (given the form values). */
  enableIf?: (values: Record<string, any>) => boolean;
  /** Component-scoped tokens: `{ radius: '0' }` on a button sets `--op-button-radius`. Keys starting with `--` are used as is. */
  theme?: Record<string, string | number>;
  /**
   * Default `true`: the component keeps its size when only its *state* changes (loading, searching, invalid).
   * The CSS reserves room for the state's extra content instead of growing. `false` lets it fit the content.
   * Does not apply to new *content* (`setText` with a longer text).
   */
  stableSize?: boolean;
  /** `true` or a text: shows a mask with a spinner over the component. */
  loading?: boolean | string;
  ariaLabel?: string;
  /** Layout `border`: where the item goes. */
  region?: 'north' | 'south' | 'west' | 'east' | 'center';
  /** Layout `grid`: columns spanned; `'full'` takes the whole row. */
  colspan?: number | 'full';
  listeners?: Record<string, Handler>;
  renderTo?: string | HTMLElement;
  /** Free slot for application data. */
  data?: unknown;
}

/** Anything that owns children (Container) and accepts being asked to drop one. */
export interface Parent {
  remove(child: Component, destroy?: boolean): unknown;
}

export class Component<C extends ComponentConfig = ComponentConfig> extends Emitter {
  static type?: string;
  config: C;
  readonly id: string;
  parent?: Component & Parent;
  rendered = false;
  mounted = false;
  destroyed = false;
  protected baseCls = 'op-component';
  protected tag: keyof HTMLElementTagNameMap = 'div';
  private _el?: HTMLElement;
  private disposers: Array<() => void> = [];
  private mask?: HTMLElement;

  constructor(config: C = {} as C) {
    super();
    this.config = { ...config };
    this.id = config.id ?? uid('op');
    for (const k in config.listeners) this.on(k, config.listeners[k]);
  }

  /** The root element. Built on first access. */
  get el(): HTMLElement {
    return this._el ?? this.render();
  }

  // ---- lifecycle (template method) ----------------------------------------------------------

  /** Builds the root element. Subclasses override to create their own DOM. */
  protected build(): HTMLElement {
    return h(this.tag, this.baseCls);
  }
  protected onRender(): void {}
  protected onMount(): void {}
  protected onDestroy(): void {}

  /** Builds the DOM once. Safe to call repeatedly. */
  render(): HTMLElement {
    if (this._el) return this._el;
    const el = (this._el = this.build());
    this.rendered = true;
    const c = this.config;
    el.id = this.id;
    if (c.cls) el.classList.add(...c.cls.split(/\s+/).filter(Boolean));
    if (typeof c.style === 'string') el.style.cssText += c.style;
    else if (c.style) for (const k in c.style) el.style.setProperty(kebab(k), String(c.style[k]));
    if (c.width != null) el.style.width = px(c.width);
    if (c.height != null) el.style.height = px(c.height);
    if (c.flex != null) el.style.flex = String(c.flex);
    if (c.ariaLabel) el.setAttribute('aria-label', c.ariaLabel);
    this.setStableSize(c.stableSize !== false);
    if (c.hidden) el.hidden = true;
    if (c.tooltip) el.dataset.opTip = c.tooltip;
    if (c.theme) this.setTheme(c.theme);
    this.onRender();
    if (c.disabled) this.setDisabled(true);
    if (c.loading) this.setLoading(c.loading);
    return el;
  }

  /** Appends to a target (default `document.body`) and fires `onMount` for the whole subtree. */
  mount(target: string | HTMLElement = document.body): this {
    const parent = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!parent) throw new Error(`Optikos: mount target not found: ${String(target)}`);
    parent.appendChild(this.el);
    this.notifyMount();
    return this;
  }

  /** Called when the element becomes part of a mounted tree. Containers override to reach children. */
  notifyMount(): void {
    if (this.mounted || this.destroyed) return;
    this.mounted = true;
    this.onMount();
    this.emit('mount');
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.onDestroy();
    for (const d of this.disposers.splice(0).reverse()) d();
    this.parent?.remove(this, false);
    this.parent = undefined;
    this._el?.remove();
    this.emit('destroy');
    this.clearListeners();
  }

  // ---- resources released on destroy --------------------------------------------------------

  /** Registers a function to run on `destroy` (listeners, timers, effects). Returns it. */
  own<F extends () => void>(fn: F): F {
    this.disposers.push(fn);
    return fn;
  }

  /** Adds a DOM listener released on `destroy`. */
  listen(target: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions | boolean): () => void {
    target.addEventListener(type, fn, opts);
    return this.own(() => target.removeEventListener(type, fn, opts));
  }

  /** `setTimeout` released on `destroy`; returns the cancel function. */
  later(fn: () => void, ms: number): () => void {
    const id = setTimeout(fn, ms);
    return this.own(() => clearTimeout(id));
  }

  // ---- common state / setters ---------------------------------------------------------------

  protected onDisabled(_disabled: boolean): void {}

  setDisabled(disabled: boolean): void {
    this.config.disabled = disabled;
    if (!this.rendered) return;
    this.el.classList.toggle('is-disabled', disabled);
    this.onDisabled(disabled);
  }

  show(): void {
    this.config.hidden = false;
    if (this.rendered) this.el.hidden = false;
    this.emit('show');
  }
  hide(): void {
    this.config.hidden = true;
    if (this.rendered) this.el.hidden = true;
    this.emit('hide');
  }
  isHidden(): boolean {
    return !!this.config.hidden;
  }

  addCls(name: string): void {
    this.el.classList.add(name);
  }
  removeCls(name: string): void {
    this.el.classList.remove(name);
  }
  toggleCls(name: string, on?: boolean): void {
    this.el.classList.toggle(name, on);
  }

  setWidth(v: number | string): void {
    this.config.width = v;
    if (this.rendered) this.el.style.width = px(v);
  }
  setHeight(v: number | string): void {
    this.config.height = v;
    if (this.rendered) this.el.style.height = px(v);
  }
  setFlex(v: number | string): void {
    this.config.flex = v;
    if (this.rendered) this.el.style.flex = String(v);
  }

  setStableSize(stable: boolean): void {
    this.config.stableSize = stable;
    if (this.rendered) this.el.classList.toggle('op-stable', stable);
  }

  setTooltip(text: string): void {
    this.config.tooltip = text;
    if (!this.rendered) return;
    if (text) this.el.dataset.opTip = text;
    else delete this.el.dataset.opTip;
  }

  setTheme(theme: Record<string, string | number>): void {
    const prefix = '--' + this.baseCls + '-';
    for (const k in theme) this.el.style.setProperty(k.startsWith('--') ? k : prefix + kebab(k), String(theme[k]));
  }

  /** Shows (or removes) a loading mask. A string is shown as text under the spinner. */
  setLoading(loading: boolean | string): void {
    this.config.loading = loading;
    if (!this.rendered) return;
    const el = this.el;
    this.mask?.remove();
    this.mask = undefined;
    el.classList.toggle('is-loading', !!loading);
    if (loading) el.setAttribute('aria-busy', 'true');
    else el.removeAttribute('aria-busy');
    if (loading) {
      this.mask = h('div', 'op-mask', {}, h('span', 'op-spinner', { role: 'progressbar', 'aria-label': t('loading') }), typeof loading === 'string' ? h('div', 'op-mask__text', {}, loading) : null);
      el.append(this.mask);
    }
    for (const child of Array.from(el.children)) if (child !== this.mask) child.toggleAttribute('inert', !!loading);
  }

  /** The element that receives focus on `focus()`. */
  protected focusEl(): HTMLElement {
    return this.el;
  }
  focus(): void {
    this.focusEl().focus();
  }
}
