import { Container, type ContainerConfig } from '../../../core/container';
import './reload';
import { register } from '../../../core/registry';
import { h, uid } from '../../../core/dom';
import { t } from '../../../core/i18n';
import { iconEl } from '../../base/icon/icon';
import { Toolbar, type ToolbarConfig } from '../toolbar/toolbar';
import { Button } from '../../base/button/button';
import type { ButtonConfig } from '../../base/button/button';

export interface PanelTool {
  icon: string;
  label: string;
  handler?: (panel: Panel, ev: MouseEvent) => void;
}

export interface PanelConfig extends ContainerConfig {
  title?: string;
  icon?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  closable?: boolean;
  closeAction?: 'destroy' | 'hide';
  /** A ↻ button in the header that calls `onReload` (a Promise shows the loading mask until it settles). */
  reloadable?: boolean;
  onReload?: (panel: Panel) => void | Promise<unknown>;
  tools?: PanelTool[];
  tbar?: ToolbarConfig['items'];
  bbar?: ToolbarConfig['items'];
  buttons?: ButtonConfig[];
  bodyCls?: string;
}

export class Panel<C extends PanelConfig = PanelConfig> extends Container<C> {
  protected override baseCls = 'op-panel';
  protected headerEl!: HTMLElement;
  protected titleEl!: HTMLElement;
  protected bodyEl!: HTMLElement;
  private toolsEl!: HTMLElement;
  private iconHost!: HTMLElement;
  private toggleBtn?: HTMLButtonElement;
  private bars: Toolbar[] = [];
  private bodyId = uid('op-body');
  private titleId = uid('op-title');

  override getBody() {
    return this.bodyEl;
  }

  protected override build() {
    const c = this.config;
    const el = h('div', this.baseCls, { role: 'region', 'aria-labelledby': this.titleId });
    this.iconHost = h('span', 'op-panel__icon');
    this.titleEl = h('span', 'op-panel__title', { id: this.titleId });
    this.toolsEl = h('div', 'op-panel__tools');
    this.headerEl = h('div', 'op-panel__header', {}, this.iconHost, this.titleEl, this.toolsEl);
    this.bodyEl = h('div', `op-panel__body ${c.bodyCls ?? ''}`, { id: this.bodyId });
    el.append(this.headerEl);
    const bar = (cfg: ToolbarConfig['items'], cls: string) => {
      const tb = new Toolbar({ items: cfg, cls });
      tb.parent = this;
      this.bars.push(tb);
      return tb.el;
    };
    if (c.tbar) el.append(bar(c.tbar, 'op-panel__tbar'));
    el.append(this.bodyEl);
    if (c.bbar) el.append(bar(c.bbar, 'op-panel__bbar'));
    if (c.buttons) el.append(bar(['->', ...c.buttons.map((b) => new Button(b))], 'op-panel__footer'));
    return el;
  }

  protected override onRender() {
    super.onRender();
    const c = this.config;
    this.setTitle(c.title ?? '');
    this.setIcon(c.icon ?? '');
    for (const tool of c.tools ?? []) this.addTool(tool.icon, tool.label, (e) => tool.handler?.(this, e));
    if (c.reloadable) this.addTool('refresh', t('reload'), () => void this.reload());
    if (c.collapsible) {
      this.toggleBtn = this.addTool('chevron-up', t('collapse'), () => this.toggle());
      this.toggleBtn.setAttribute('aria-controls', this.bodyId);
      this.el.classList.add('op-panel--collapsible');
      this.listen(this.titleEl, 'click', () => this.toggle());
    }
    if (c.closable) this.addTool('x', t('close'), () => this.close());
    this.setCollapsed(!!c.collapsed);
    this.updateHeader();
  }

  private addTool(icon: string, label: string, onClick: (e: MouseEvent) => void) {
    const b = h('button', 'op-panel__tool', { type: 'button', 'aria-label': label, 'data-op-tip': label }, iconEl(icon));
    this.listen(b, 'click', onClick);
    this.toolsEl.append(b);
    return b;
  }

  private updateHeader() {
    const c = this.config;
    this.headerEl.hidden = !c.title && !c.icon && !c.collapsible && !c.closable && !c.reloadable && !c.tools?.length;
  }

  /** Runs `onReload` (`before-reload` can cancel); a returned Promise keeps the loading mask (and a turning ↻) until it settles. */
  async reload(): Promise<boolean> {
    const el = this.el;
    if (el.classList.contains('is-reloading') || this.emit('before-reload') === false) return false;
    el.classList.add('is-reloading');
    this.setLoading(true);
    await Promise.resolve(this.config.onReload?.(this)).catch(() => 0);
    this.setLoading(false);
    el.classList.remove('is-reloading');
    this.emit('reload');
    return true;
  }

  setTitle(title: string) {
    this.config.title = title;
    if (!this.rendered) return;
    this.titleEl.textContent = title;
    this.updateHeader();
  }

  setIcon(name: string) {
    this.config.icon = name;
    if (!this.rendered) return;
    this.iconHost.replaceChildren(...(name ? [iconEl(name)] : []));
    this.iconHost.hidden = !name;
    this.updateHeader();
  }

  /** Collapses/expands without events. Use `collapse()`/`expand()` for the full behavior. */
  setCollapsed(collapsed: boolean) {
    this.config.collapsed = collapsed;
    if (!this.rendered) return;
    this.el.classList.toggle('is-collapsed', collapsed);
    for (const e of [this.bodyEl, ...this.bars.map((b) => b.el)]) e.hidden = collapsed;
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      this.toggleBtn.setAttribute('aria-label', t(collapsed ? 'expand' : 'collapse'));
    }
  }

  collapse() {
    if (this.config.collapsed || this.emit('before-collapse') === false) return;
    this.setCollapsed(true);
    this.emit('collapse');
  }
  expand() {
    if (!this.config.collapsed || this.emit('before-expand') === false) return;
    this.setCollapsed(false);
    this.emit('expand');
  }
  toggle() {
    if (this.config.collapsed) this.expand();
    else this.collapse();
  }

  close() {
    if (this.emit('before-close') === false) return;
    this.emit('close');
    if (this.config.closeAction === 'hide') this.hide();
    else this.destroy();
  }

  protected override onDestroy() {
    super.onDestroy();
    this.bars.forEach((b) => b.destroy());
  }
}
register('panel', Panel);
