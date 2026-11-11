import { Component, type ComponentConfig, type Parent } from './component';
import { create, type AnyConfig } from './registry';
import { createLayout, type Layout, type LayoutSpec } from '../layout/layout';

/** What a Tabs header reads from its panel (any Container, not just Panel). */
export interface TabPanelConfig {
  title?: string;
  icon?: string;
  closable?: boolean;
  reloadable?: boolean;
  /** Called by the tab's ↻; a returned Promise keeps the tab busy until it settles. */
  onReload?: (panel: any) => void | Promise<unknown>;
}

export interface ContainerConfig extends ComponentConfig, TabPanelConfig {
  items?: Array<AnyConfig | Component | string>;
  layout?: LayoutSpec;
  /** Config merged into every item that does not set the key itself. */
  defaults?: Record<string, unknown>;
  /** `type` used by items that do not declare one. */
  defaultType?: string;
  /** Layout `card`: initial visible child (index or id). */
  activeItem?: number | string;
}

export class Container<C extends ContainerConfig = ContainerConfig> extends Component<C> implements Parent {
  protected override baseCls = 'op-container';
  protected defaultLayout: LayoutSpec | undefined;
  items: Component[] = [];
  layout?: Layout;

  constructor(config: C = {} as C) {
    super(config);
    this.items = (config.items ?? []).map((i) => this.make(i));
  }

  /** Element that holds the children. Panels override it. */
  getBody(): HTMLElement {
    return this.el;
  }

  /** Turns shorthand strings (`'->'`) into configs. Subclasses override; the base has none. */
  protected shorthand(s: string): AnyConfig {
    throw new Error(`Optikos: no shorthand for item "${s}" in ${this.baseCls}`);
  }

  private make(item: AnyConfig | Component | string): Component {
    if (typeof item === 'string') item = this.shorthand(item);
    const c = item instanceof Component ? item : create({ type: this.config.defaultType, ...this.config.defaults, ...item });
    c.parent = this;
    return c;
  }

  protected override onRender(): void {
    const spec = this.config.layout ?? this.defaultLayout;
    if (spec) (this.layout = createLayout(spec)).init(this);
    this.items.forEach((c, i) => this.attach(c, i));
  }

  protected attach(c: Component, index: number): void {
    const body = this.getBody();
    const next = this.items.slice(index + 1).find((x) => x.rendered && x.el.parentNode === body);
    body.insertBefore(c.el, next?.el ?? null);
    this.layout?.add?.(this, c, index);
    if (this.mounted) c.notifyMount();
  }

  add(item: AnyConfig | Component | string): Component {
    return this.insert(this.items.length, item);
  }

  insert(index: number, item: AnyConfig | Component | string): Component {
    const c = this.make(item);
    this.items.splice(index, 0, c);
    if (this.rendered) this.attach(c, index);
    this.emit('add', c);
    return c;
  }

  /** Removes a child (by instance, id or index). Destroys it unless `destroy` is `false`. */
  remove(child: Component | string | number, destroy = true): Component | undefined {
    const i = typeof child === 'number' ? child : this.items.findIndex((c) => c === child || c.id === child);
    const c = this.items[i];
    if (!c) return;
    this.items.splice(i, 1);
    c.parent = undefined;
    this.layout?.remove?.(this, c, i);
    if (destroy) c.destroy();
    else if (c.rendered) c.el.remove();
    this.emit('remove', c);
    return c;
  }

  removeAll(destroy = true): void {
    for (const c of [...this.items]) this.remove(c, destroy);
  }

  getItems(): Component[] {
    return this.items;
  }

  /** Direct child by id. */
  get(id: string): Component | undefined {
    return this.items.find((c) => c.id === id);
  }

  /** All descendants (depth-first) matching `fn`. */
  query(fn: (c: Component) => boolean): Component[] {
    const out: Component[] = [];
    for (const c of this.items) {
      if (fn(c)) out.push(c);
      if (c instanceof Container) out.push(...c.query(fn));
    }
    return out;
  }

  /** Layout `card`: which child is visible. */
  getActiveItem(): Component | undefined {
    return this.layout?.getActive?.(this);
  }
  setActiveItem(item: Component | string | number): void {
    const c = typeof item === 'number' ? this.items[item] : this.items.find((x) => x === item || x.id === item);
    if (c) this.layout?.activate?.(this, c);
  }

  override notifyMount(): void {
    super.notifyMount();
    for (const c of this.items) c.notifyMount();
  }

  protected override onDestroy(): void {
    for (const c of [...this.items]) c.destroy();
  }

  override setDisabled(disabled: boolean): void {
    super.setDisabled(disabled);
    for (const c of this.items) c.setDisabled(disabled);
  }
}
