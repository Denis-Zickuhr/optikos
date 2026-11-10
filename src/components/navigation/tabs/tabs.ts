import { Container, type ContainerConfig } from '../../../core/container';
import '../../layout/panel/reload';
import { Component } from '../../../core/component';
import { register, type AnyConfig } from '../../../core/registry';
import { h } from '../../../core/dom';
import { t, addMessages } from '../../../core/i18n';
import { roving } from '../../../core/focus';
import { iconEl } from '../../base/icon/icon';

addMessages('en', {
  tabErrors: 'errors',
});
addMessages('pt-BR', {
  tabErrors: 'erros',
});

export interface TabsConfig extends ContainerConfig {
  /** Initially active tab (index or id). */
  active?: number | string;
  position?: 'top' | 'left';
  /** Build a panel's DOM only the first time its tab is activated. Default true. */
  lazy?: boolean;
  /** Default `closable` for tabs. */
  closable?: boolean;
  /** Default `reloadable` for tabs: a ↻ in the tab that calls the panel's `onReload`. */
  reloadable?: boolean;
}

/**
 * Items are the panels. Each may carry `title`, `icon`, `closable` and `disabled` for its tab header.
 * Tabs reuse the `card` layout of Container for the panels.
 */
export class Tabs extends Container<TabsConfig> {
  protected override baseCls = 'op-tabs';
  private barEl!: HTMLElement;
  private panelsEl!: HTMLElement;
  private tabs = new Map<Component, HTMLElement>();
  private pending = new Set<Component>();
  private rover?: ReturnType<typeof roving>;

  constructor(config: TabsConfig = {}) {
    super({ defaultType: 'container', ...config });
  }

  override getBody() {
    return this.panelsEl;
  }

  protected override build() {
    const left = this.config.position === 'left';
    const el = h('div', `op-tabs${left ? ' op-tabs--left' : ''}`);
    this.barEl = h('div', 'op-tabs__bar', { role: 'tablist', 'aria-orientation': left ? 'vertical' : 'horizontal' });
    this.panelsEl = h('div', 'op-tabs__panels');
    el.append(this.barEl, this.panelsEl);
    return el;
  }

  protected override onRender() {
    const c = this.config;
    c.layout = { type: 'card', activeItem: c.active ?? 0 };
    this.items.forEach((p) => this.addHeader(p));
    this.rover = roving(this.barEl, {
      selector: '[role=tab]',
      orientation: c.position === 'left' ? 'vertical' : 'horizontal',
      onMove: (tab) => this.setActive(this.items.find((p) => this.tabs.get(p) === tab)!),
    });
    this.own(() => this.rover?.destroy());
    this.on('activate', (p?: Component) => this.syncHeaders(p));
    this.listen(this.barEl, 'click', (e: Event) => {
      const target = e.target as HTMLElement;
      const tab = target.closest<HTMLElement>('[role=tab]');
      const panel = this.items.find((p) => this.tabs.get(p) === tab);
      if (!panel) return;
      if (target.closest('.op-tabs__close')) this.closeTab(panel);
      else if (target.closest('.op-tabs__reload')) (this.setActive(panel), void this.reloadTab(panel));
      else this.setActive(panel);
    });
    this.listen(this.barEl, 'keydown', (e: KeyboardEvent) => {
      const panel = this.items.find((p) => this.tabs.get(p) === (e.target as HTMLElement).closest('[role=tab]'));
      if (e.key === 'Delete' && panel) this.closeTab(panel);
      else if (panel && (e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey && this.tabConfig(panel).reloadable) void this.reloadTab(panel);
    });
    super.onRender();
  }

  private forcing?: Component;

  /** Lazy panels (everything but the active one) are attached the first time they are activated. */
  protected override attach(p: Component, index: number) {
    if (this.config.lazy !== false && p !== this.getActiveItem() && p !== this.forcing) {
      this.pending.add(p);
      return;
    }
    super.attach(p, index);
    p.el.setAttribute('role', 'tabpanel');
    p.el.tabIndex = 0; // APG: the panel is reachable by Tab even when its content has nothing focusable (or scrolls)
    const tab = this.tabs.get(p);
    if (tab) {
      p.el.setAttribute('aria-labelledby', tab.id);
      tab.setAttribute('aria-controls', p.el.id);
    }
  }

  /** Builds a pending panel's DOM now. */
  private ensure(p: Component) {
    if (!this.pending.delete(p)) return;
    this.forcing = p;
    this.attach(p, this.items.indexOf(p));
    this.forcing = undefined;
  }

  private tabConfig(p: Component) {
    const c = p.config as AnyConfig;
    return { title: (c.title as string) ?? '', icon: c.icon as string | undefined, closable: (c.closable as boolean) ?? this.config.closable ?? false, reloadable: (c.reloadable as boolean) ?? this.config.reloadable ?? false, disabled: !!c.disabled };
  }

  private addHeader(p: Component) {
    const { title, icon, closable, reloadable, disabled } = this.tabConfig(p);
    const tab = h('div', 'op-tabs__tab', { role: 'tab', id: `${p.id}-tab`, tabindex: -1, 'aria-selected': 'false', 'aria-disabled': disabled ? 'true' : null });
    tab.append(icon ? iconEl(icon) : '', h('span', 'op-tabs__title', {}, title));
    if (reloadable) tab.append(h('span', 'op-tabs__reload', { 'aria-hidden': 'true', 'data-op-tip': t('reload') }, iconEl('refresh')));
    if (closable) tab.append(h('span', 'op-tabs__close', { 'aria-hidden': 'true', 'data-op-tip': t('close') }, iconEl('x')));
    this.tabs.set(p, tab);
    this.barEl.append(...[...this.items].filter((x) => this.tabs.has(x)).map((x) => this.tabs.get(x)!));
  }

  private syncHeaders(active?: Component) {
    for (const [p, tab] of this.tabs) {
      const on = p === active;
      tab.setAttribute('aria-selected', String(on));
      tab.classList.toggle('is-active', on);
    }
    const tab = active && this.tabs.get(active);
    this.rover?.sync(tab || undefined);
  }

  // ---- API -----------------------------------------------------------------------------------

  getActive(): Component | undefined {
    return this.getActiveItem();
  }

  /** Activates a tab (instance, id or index). `before-change` can cancel. */
  setActive(tab: Component | string | number): void {
    const p = typeof tab === 'number' ? this.items[tab] : typeof tab === 'string' ? this.items.find((x) => x.id === tab) : tab;
    const prev = this.getActiveItem();
    if (!p || p === prev || this.tabConfig(p).disabled) return;
    if (this.emit('before-change', p, prev) === false) return;
    this.ensure(p);
    this.setActiveItem(p);
    this.emit('change', p, this.items.indexOf(p));
  }

  override insert(index: number, item: AnyConfig | Component | string): Component {
    const p = super.insert(index, item);
    if (this.rendered) {
      this.addHeader(p);
      this.ensure(p); // a tab added after render becomes the active one right away
      this.setActive(p);
    }
    return p;
  }

  /**
   * Reloads a tab: calls its panel's `onReload` (`before-reload` can cancel). While a returned Promise is pending the panel
   * shows its loading mask and the tab's ↻ spins; `reload(panel)` fires when it is done.
   */
  async reloadTab(tab: Component | string | number): Promise<boolean> {
    const p = typeof tab === 'number' ? this.items[tab] : typeof tab === 'string' ? this.items.find((x) => x.id === tab) : tab;
    const head = p && this.tabs.get(p);
    if (!p || head?.classList.contains('is-reloading') || this.emit('before-reload', p) === false) return false;
    head?.classList.add('is-reloading');
    const busy = (p.config as AnyConfig).onReload?.(p) as unknown;
    if (busy instanceof Promise) {
      p.setLoading(true);
      await busy.catch(() => undefined);
      p.setLoading(false);
    }
    head?.classList.remove('is-reloading');
    this.emit('reload', p);
    return true;
  }

  /** Closes a tab (`before-close` can cancel). The neighbor becomes active. */
  closeTab(tab: Component | string | number): void {
    const p = typeof tab === 'number' ? this.items[tab] : typeof tab === 'string' ? this.items.find((x) => x.id === tab) : tab;
    if (!p || this.emit('before-close', p) === false) return;
    this.remove(p);
    this.emit('close', p);
  }

  override remove(child: Component | string | number, destroy = true): Component | undefined {
    const p = typeof child === 'number' ? this.items[child] : typeof child === 'string' ? this.items.find((x) => x.id === child) : child;
    const hadFocus = p && this.tabs.get(p)?.contains(document.activeElement);
    const removed = super.remove(child, destroy);
    if (p) {
      this.tabs.get(p)?.remove();
      this.tabs.delete(p);
      this.pending.delete(p);
      const active = this.getActiveItem();
      if (active) this.ensure(active);
      if (hadFocus && active) this.tabs.get(active)?.focus();
    }
    return removed;
  }

  /** Marks a tab header: a badge with the number of errors in its panel and a dot while something in it changed. */
  setTabState(tab: Component, state: { errors?: number; dirty?: boolean }): void {
    const el = this.tabs.get(tab);
    if (!el) return;
    el.classList.toggle('has-error', !!state.errors);
    el.classList.toggle('is-dirty', !!state.dirty);
    let badge = el.querySelector<HTMLElement>('.op-tabs__badge');
    if (!state.errors) return badge?.remove();
    if (!badge) {
      badge = h('span', 'op-tabs__badge');
      el.insertBefore(badge, el.querySelector('.op-tabs__close'));
    }
    badge.replaceChildren(String(state.errors), h('span', 'op-sr-only', {}, ` ${t('tabErrors')}`));
  }

  setTitle(tab: Component, title: string) {
    (tab.config as AnyConfig).title = title;
    const el = this.tabs.get(tab)?.querySelector('.op-tabs__title');
    if (el) el.textContent = title;
  }
}
register('tabs', Tabs);
